import Image from "next/image";
import UserButton from "./UserButton";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 p-5 fixed top-0 left-0 w-full z-1">
      <div className="navbar-start">
        <Image src="/safehub.svg" alt="logo" width={120} height={60} priority />
      </div>

      <div className="navbar-end gap-5">
        <a href="#about" className="btn btn-outline text-primary">
          About Us
        </a>
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;
