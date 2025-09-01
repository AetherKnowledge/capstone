import AiChatBox from "./AiChatbox/AiChatBox";

const AiChatbotPage = () => {
  return (
    <div className="flex flex-col h-[82vh] ">
      <div className="p-4 border-b-1 border-none rounded-t-2xl text-base-content bg-base-100">
        <h2 className="text-3xl font-bold text-primary">MentalCare Chatbot</h2>
      </div>
      <div className="divider mt-[-8] mb-[-8] pl-3 pr-3" />
      <AiChatBox />
    </div>
  );
};

export default AiChatbotPage;
