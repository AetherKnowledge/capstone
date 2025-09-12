"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";
import { useCalling } from "../../../../lib/socket/hooks/useCalling";
import VideoContainer from "../../Video/VideoContainer";

interface CallPopupContextType {
  initiateCall: (chatId: string) => void;
  setVideoPopup: (value: boolean) => void;
  setRingingPopup: (value: boolean) => void;
}

export const CallPopupContext = createContext<CallPopupContextType | undefined>(
  undefined
);

export const useCallPopup = () => {
  const context = useContext(CallPopupContext);
  if (context === undefined) {
    throw new Error("useCallPopup must be used within a CallPopupProvider");
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

const CallPopup = ({ children }: Props) => {
  const [
    calling,
    initiateCall,
    answerCall,
    rejectCall,
    leaveCall,
    localStream,
    peers,
  ] = useCalling();

  const callPopupContextValue: CallPopupContextType = {
    setVideoPopup: (value: boolean) => {
      setVideoPopup(value);
    },
    setRingingPopup: (value: boolean) => {
      setRingingPopup(value);
    },
    initiateCall: (chatId: string) => {
      initiateCall(chatId);
      setVideoPopup(true); // Show the video popup when initiating a call
    },
  };

  const session = useSession();
  const [ringingPopup, setRingingPopup] = useState(false);
  const [videoPopup, setVideoPopup] = useState(false);

  useEffect(() => {
    if (calling && calling.callerId !== session.data?.user.id) {
      console.log("Incoming call:", calling);
      setRingingPopup(true); // Show the popup when there is an incoming call
    } else if (calling && calling.callerId === session.data?.user.id) {
      console.log("Outgoing call initiated:", calling);
      setVideoPopup(true); // Show the video popup when initiating a call
    } else {
      setRingingPopup(false); // Hide the popup when there is no call
      setVideoPopup(false); // Hide the video popup when there is no call
    }
  }, [calling]);

  const handleAnswer = () => {
    answerCall();
    setRingingPopup(false); // Close the popup
    setVideoPopup(true); // Show the video popup when answering a call
  };

  const handleReject = () => {
    rejectCall();
    setRingingPopup(false); // Close the popup
  };

  const handleLeaveCall = () => {
    leaveCall();
    setVideoPopup(false);
  };

  useEffect(() => {
    if (peers && localStream) {
      console.log("Setting up peer connection with local stream");
    }
  }, [peers, localStream]);

  return (
    <div>
      {ringingPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-10 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-bold mb-4">Incoming Call</h3>
            <p className="mb-4">{calling?.callerName || "Unknown Caller"}</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={handleAnswer}
              >
                Answer
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {videoPopup && (
        <VideoContainer
          stream={localStream}
          isLocalStream={true}
          onEndCall={handleLeaveCall}
          peers={peers}
        />
      )}
      <CallPopupContext.Provider value={callPopupContextValue}>
        {children}
      </CallPopupContext.Provider>
    </div>
  );
};

export default CallPopup;
