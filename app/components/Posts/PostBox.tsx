"use client";
import { useState } from "react";
import ImageGrid from "./ImageGrid";
import { PostProps } from "./PostActions";
import PostPopup from "./PostPopup"; // Add this import
import PostStats from "./PostStats";

const EventBox = ({
  id,
  date,
  title,
  content,
  images,
  authorName,
  authorImage,
  likesStats,
  dislikesStats,
  comments = [],
}: PostProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);
  const [optimisticComments, setOptimisticComments] = useState(comments);

  return (
    <>
      <div
        className={`card bg-base-100 max-w-2xl mx-auto ${
          expanded ? "max-h-[1000px]" : "max-h-[700px]"
        } overflow-hidden`}
      >
        {/* IMAGE GRID */}
        <div className="px-4">
          <ImageGrid images={images} />
        </div>

        <div className="card-body flex flex-col p-4 pt-0 px-6">
          {/* STATS */}
          <div className="pt-2">
            <PostStats
              id={id}
              likesStats={likesStats}
              dislikesStats={dislikesStats}
              comments={optimisticComments}
              showPopup={showPopup}
              setShowPopup={setShowPopup}
            />
          </div>

          <div>
            {/* Date */}
            {/* <div className="flex justify-between items-end text-sm text-base-content/60">
              <span>{date}</span>
            </div> */}

            {/* Title */}
            <h2 className="text-base-content font-bold leading-tight br text-2xl">
              {title}
            </h2>
          </div>

          {/* Text */}
          <p className="text-sm text-base-content">
            {expanded ? (
              <>{content} </>
            ) : (
              <>
                {content.length > 200 ? content.slice(0, 200) + "..." : content}
              </>
            )}
            {content.length > 200 && (
              <button
                onClick={toggleExpand}
                className="text-sm text-base-content/50 font-semibold ml-1 hover:underline"
              >
                {expanded ? "See less" : "See more..."}
              </button>
            )}
          </p>
        </div>
      </div>
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowPopup(false)} // Close on overlay click
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
          >
            <PostPopup
              id={id}
              date={date}
              title={title}
              content={content}
              images={images}
              authorName={authorName}
              authorImage={authorImage}
              likesStats={likesStats}
              dislikesStats={dislikesStats}
              comments={optimisticComments}
              setComments={setOptimisticComments}
              showPopup={showPopup}
              setShowPopup={setShowPopup}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EventBox;
