import ChatsPage from "@/app/components/Chats/ChatsPage";

const page = async ({ params }: { params: Promise<{ chatId: string }> }) => {
  const { chatId } = await params;

  return (
    <div className="flex-1 pt-25">
      <div className="bg-base-100 shadow-br rounded-xl">
        <ChatsPage chatId={chatId} />
      </div>
    </div>
  );
};

export default page;
