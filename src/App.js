import React, {useEffect} from "react";
import { observer, inject } from "mobx-react";
import PredictionPanel from './components/PredictionPanel';

function App({
  store: { connect, droneConnect, museClient, batteryLevel, shouldConnectDrone }
}) {

  return (
    <div className="App">
      <main>
        <div
          className="relative pt-16 pb-32 flex content-center items-center justify-center"
          style={{
            minHeight: "75vh"
          }}
        >
          <div
            className="absolute top-0 w-full h-full bg-center bg-cover"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjExMDk0fQ&auto=format&fit=crop&w=2550&q=80')"
            }}
          >
            <span
              id="blackOverlay"
              className="w-full h-full absolute opacity-50 bg-black"
            ></span>
          </div>
          <div className="container relative mx-auto">
            <div className="items-center flex flex-wrap">
              <div className="w-full lg:w-8/12 px-4 ml-auto mr-auto text-center">
                <div className="pr-12">
                  <h1 className="text-white font-semibold text-5xl">
                    Let's play around with our mind
                  </h1>
                  <p className="mt-4 text-3xl text-gray-300">
                    In this example we will see how Muse headset works and how
                    we can use it to control the app
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden"
            style={{ height: "70px", transform: "translateZ(0)" }}
          >
            <svg
              className="absolute bottom-0 overflow-hidden"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              version="1.1"
              viewBox="0 0 2560 100"
              x="0"
              y="0"
            >
              <polygon
                className="text-gray-300 fill-current"
                points="2560 0 2560 100 0 100"
              ></polygon>
            </svg>
          </div>
        </div>

        <section className="pb-20 bg-gray-300 -mt-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-between">
              <div className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center">
                <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg">
                  <div
                    className="px-4 py-5 flex-auto hover:shadow-lg cursor-pointer"
                    onClick={() => {
                      if (!museClient) {
                        connect();
                      }
                    }}
                  >
                    <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-red-400">
                      <i className="fas fa-award"></i>
                    </div>
                    <h6 className="text-xl font-semibold">
                      {!museClient ? "Connect Muse" : "Muse Connected"}
                    </h6>
                    <p className="mt-2 mb-4 text-gray-600">
                      {!museClient ? `Let' connect muse headset` : batteryLevel}
                    </p>
                  </div>
                </div>
              </div>
              
                {/* <div className="w-full md:w-4/12 px-4 text-center " onClick={() => droneConnect()}>
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg">
                    <div className="px-4 py-5 flex-auto hover:shadow-lg cursor-pointer">
                      <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-blue-400">
                        <i className="fas fa-retweet"></i>
                      </div>
                      <h6 className="text-xl font-semibold">Connect Drone</h6>
                      <p className="mt-2 mb-4 text-gray-600">
                        Let's connect drone to our web app
                      </p>
                    </div>
                  </div>
                </div> */}

            </div>
            {/* <PredictionPanel /> */}
          </div>
          
        </section>

        

      </main>
    </div>
  );
}

export default inject("store")(observer(App));
