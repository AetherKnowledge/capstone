import Divider from "../../Divider";
import { getPosts } from "../../Posts/PostActions";
import EventBox from "../../Posts/PostBox";

const Dashboard = async () => {
  const posts = await getPosts();
  console.log("Posts:", posts);

  return (
    <div className="pt-25 max-w-3xl">
      <div className="bg-base-100 shadow-br rounded-xl">
        <div className="p-4 border-b-1 border-none rounded-t-2xl text-base-content bg-base-100">
          <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
        </div>
        <Divider />
        {posts.map((post) => (
          <div key={post.id}>
            <EventBox {...post} />
            {post.id !== posts[posts.length - 1].id && <Divider />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
