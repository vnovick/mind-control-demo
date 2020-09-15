import { types } from "mobx-state-tree"
import {ParrotDrone} from './drone';
import { Observable  } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/map';
import { switchMap, map, filter, distinctUntilChanged} from "rxjs/operators";
import { MuseClient, channelNames, MUSE_SERVICE, zipSamples } from "muse-js";

import {
    bandpassFilter,
    epoch,
    fft,
    deltaPower,
    alphaPower
  } from "@neurosity/pipes";

export const Settings = {
    cutOffLow: 2,
    cutOffHigh: 20,
    interval: 256,
    bins: 256,
    sliceFFTLow: 1,
    sliceFFTHigh: 30,
    duration: 1512,
    srate: 256,
  }
  
  

let drone = ParrotDrone();

const Drone = types.model({
    inAir: types.boolean,
    state: types.string
})

const RootStore = types.model({
    drone: Drone,
    enableDrone: types.boolean,
    clientIsSet: types.boolean,
    battery: types.number,
    eeg: types.array(types.array(types.number))
}).actions(self => ({
    dc(){
        try {
            drone.connect().then(() => {
                console.log(self)
              self.setDroneConnected()
            }).catch(err => {
              console.log(err)
            })
          } catch (err){
            console.log(err)
          }
    },
    setDroneConnected(){
        console.log("Drone is Connected")
        self.drone.state = "connected"
        window.drone = drone;
    },
    disconnectDrone(){
      console.log("Drone is disconnected")
      self.drone.state = "disconnected"
    },
    moveRight(){
        if (self.drone.inAir){
            drone.moveRight();
        }
    },
    moveLeft(){
        if (self.drone.inAir){
            drone.moveLeft();
        }
    },
    flip(){
        if (self.drone.inAir){
            drone.flip()
        }
    },
    takeOff(){
        if(!self.drone.inAir && self.drone.state === 'connected') {
            drone.takeOff()
            self.drone.inAir = true;
            console.log("take off")
        }
    },
    land(){
        if(self.drone.inAir && self.drone.state === 'connected') {
            drone.land()
            self.drone.inAir = false;
            console.log("land")
        }
    },
    setClientAsInitialized(){
        self.clientIsSet = true;
    },
    subscribeToEegUpdatesWithEpoch(){
      zipSamples(self.client.eegReadings).pipe(
        bandpassFilter({ 
          cutoffFrequencies: [Settings.cutOffLow, Settings.cutOffHigh], 
          nbChannels: 4
        }),
        epoch({ duration: 800, interval: 100 }),
        fft({ bins: 256 }),
      ).subscribe((value) => {
        self.setEegData(value.psd)
      })
    },
    setEegData(data){
      self.eeg = data;
    },
    subscribeToAccelerometerData(){
        self.client.accelerometerData
              .subscribe(data => {
                if (data.samples[2].y > 0.1 && data.samples[2].x > -0.2) {
                  console.log("Right")
                }
    
              
                if (data.samples[2].y < 0.1 && data.samples[2].x < -0.2 ) {
                  console.log("Left")
                }
              })
    },
    subscribeToBlinking(){
        const leftEyeChannel = channelNames.indexOf("AF7");
        const blinkingStream = self.client.eegReadings.pipe(
          filter(r => r.electrode === leftEyeChannel),
          map(r => Math.max(...r.samples.map(n => Math.abs(n)))),
          filter(max => max > 300),
          switchMap(() =>
          Observable.merge(
              Observable.of(1),
              Observable.timer(500).map(() => 0)
            )
          ),
          distinctUntilChanged()
        )
    
        blinkingStream.subscribe(value => {
        if (value === 1){
            console.log("Blink")
            if (self.drone.inAir){
            self.land()
            } else {
            self.takeOff()
            }
        }
        })
    },
    subscribeToFocus(){
        const focusPipe = zipSamples(self.client.eegReadings).pipe(
            bandpassFilter({ 
              cutoffFrequencies: [Settings.cutOffLow, Settings.cutOffHigh], 
              nbChannels: 4 }),
            epoch({ duration: 800, interval: 100 }),
            fft({ bins: 256 }),
            deltaPower(),
            map(r => Math.max(...r)),
            filter(reading => reading > 250),
          );

          focusPipe.subscribe(delta => {
              console.log(delta)
          });

          const eyesClosed = zipSamples(self.client.eegReadings).pipe(
            bandpassFilter({ 
              cutoffFrequencies: [Settings.cutOffLow, Settings.cutOffHigh], 
              nbChannels: 4 }),
            epoch({ duration: 800, interval: 100 }),
            fft({ bins: 256 }),
            alphaPower(),
            map(r => Math.max(...r)),
            filter(reading => reading < 50),
          );

          eyesClosed.subscribe(alpha => {
              console.log("alpha", alpha)
          });
    },
    subscribeToBatteryData(){
        self.client.telemetryData.subscribe(telemetry => {
            self.setBattery(telemetry.batteryLevel)
        })
    },
    setBattery(batteryLevel){
        self.battery = batteryLevel
    },
    async connect() {
        self.client = await new MuseClient();
        if (!this.device) {
          try {
            this.device = await window.navigator.bluetooth.requestDevice({
              filters: [{ services: [MUSE_SERVICE] }]
            });
            this.gatt = await this.device.gatt.connect();
            await self.client.connect(this.gatt);
            await self.client.start();
            self.setClientAsInitialized()
            const leftChannel = channelNames.indexOf('AF7')
            // self.client.eegReadings.subscribe(eeg => console.log(eeg))
            // self.subscribeToBatteryData()
            self.subscribeToBlinking()
            // self.subscribeToAccelerometerData()
            // self.subscribeToFocus()
          } catch(err){
            console.log(err)
          }
        }
      }
})).views(self => ({
    // computed part of Mobx
    get museClient(){
        return self.clientIsSet ? self.client : null
    },
    get eegReadings(){
      return self.eeg
    },
    get batteryLevel(){
        return self.battery
    },
    get shouldConnectDrone(){
        return self.enableDrone
    },
    get isDroneConnected(){
      return self.drone.state === 'connected'
    },
    get emergencyCutOff(){
      return self.drone.emergencyCutOff()
    }
  }))




  export const store = RootStore.create({
    drone: {
        inAir: false,
        state: 'offline'
    },
    enableDrone: true,
    battery: 0,
    clientIsSet: false,
    eeg: Array(12).fill(Array(12).fill(0))
})