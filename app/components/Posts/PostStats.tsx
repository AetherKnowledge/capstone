import { useState } from "react";
import { FaRegBookmark, FaRegComment, FaRegHeart } from "react-icons/fa6";
import { HiDotsHorizontal } from "react-icons/hi";
import { PostComment, PostStat, dislikePost, likePost } from "./PostActions";
import StatButton from "./StatsButton";

//TODO: Change like to heart

type PostStatsProps = {
  id: string;
  likesStats: PostStat;
  dislikesStats: PostStat;
  comments: PostComment[];
  showPopup: boolean;
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
};

const PostStats = ({
  id,
  likesStats,
  dislikesStats,
  comments,
  showPopup,
  setShowPopup,
}: PostStatsProps) => {
  const [optimisticLikesStats, setOptimisticLikesStats] =
    useState<PostStat>(likesStats);
  const [optimisticDislikesStats, setOptimisticDislikesStats] =
    useState<PostStat>(dislikesStats);

  const changeStatus = async (value: boolean, isLike: boolean) => {
    if (isLike) {
      setOptimisticLikesStats({
        count: optimisticLikesStats.count + (value ? 1 : -1),
        selected: value,
      });
      if (optimisticDislikesStats.selected) {
        setOptimisticDislikesStats({
          count: optimisticDislikesStats.count - 1,
          selected: !value,
        });
      }
      await likePost(id, value);
    } else {
      setOptimisticDislikesStats({
        count: optimisticDislikesStats.count + (value ? 1 : -1),
        selected: value,
      });
      if (optimisticLikesStats.selected) {
        setOptimisticLikesStats({
          count: optimisticLikesStats.count - 1,
          selected: !value,
        });
      }
      await dislikePost(id, value);
    }
  };
  return (
    <>
      <div className="flex justify-between items-center text-sm text-base-content/80">
        <div className="flex items-start gap-4 w-full">
          <StatButton
            onChange={async (value: boolean) => {
              changeStatus(value, true);
            }}
            icon={FaRegHeart}
            value={optimisticLikesStats}
            label="Likes"
            color="text-blue-500"
          />
          <StatButton
            onChange={async (value: boolean) => {
              setShowPopup(value);
            }}
            icon={FaRegComment}
            value={{ count: comments.length, selected: showPopup }}
            label="Comments"
            color="text-yellow-500"
            commentBtn
          />
        </div>
        <div className="flex items-end gap-4">
          <StatButton
            onChange={async (value: boolean) => {}}
            icon={FaRegBookmark}
            value={{ count: 4, selected: false }}
            label="Saved"
          />
          <HiDotsHorizontal className="text-2xl" />
        </div>
      </div>
    </>
  );
};

export default PostStats;
