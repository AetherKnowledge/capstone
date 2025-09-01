import React from "react";
import { IconType } from "react-icons";
import { PostStat } from "./PostActions";

type ButtonProps = {
  onChange: (value: boolean) => Promise<void>;
  icon: IconType;
  value: PostStat;
  label: string;
  color?: string;
  commentBtn?: boolean;
  className?: string;
};

function StatButton({
  onChange,
  icon,
  value,
  label,
  color = "text-green-500",
  className,
}: ButtonProps) {
  return (
    <label className="swap">
      <input
        type="checkbox"
        checked={value.selected}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
      />
      <div className="swap-on flex flex-col items-center justify-between hover:cursor-pointer">
        {React.createElement(icon, {
          className: `text-xl ${color} ${className || ""}`,
        })}
        {/* <p>{`${value.count.toString()} ${label}`}</p> */}
      </div>
      <div className="swap-off flex flex-col items-center justify-between hover:cursor-pointer">
        {React.createElement(icon, {
          className: `text-xl text-base-content ${className || ""}`,
        })}
        {/* <p>{`${value.count.toString()} ${label}`}</p> */}
      </div>
    </label>
  );
}

export default StatButton;
