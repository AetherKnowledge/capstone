import { getPosts } from "./PostActions";
import EventBox from "./PostBox";
import PostCreateBox from "./PostCreateBox";

const EventsPage = async () => {
  const posts = await getPosts();
  console.log("Posts:", posts);

  return (
    <div>
      <div className="flex flex-col h-[82vh] ">
        <div className="p-4 border-b-1 border-none rounded-t-2xl text-base-content bg-base-100">
          <h2 className="text-3xl font-bold text-primary">Events</h2>
        </div>
        <PostCreateBox />
        <div className="divider mt-[-8] pl-3 pr-3" />

        <div className="divider mt-[-8] pl-3 pr-3" />
        <div className="overflow-y-auto h-full">
          {posts.map((post) => (
            <div key={post.id}>
              <EventBox {...post} />
              <div className="divider mt-[-8] pl-3 pr-3" />
              <p>test</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
