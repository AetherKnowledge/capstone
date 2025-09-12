import Navbar from "../Navbar";
import LoginButton from "./LoginButton";

const Hero = () => {
  return (
    <>
      <Navbar />
      <section
        id="hero"
        className="hero w-full h-screen bg-gradient-to-r from-black/95 to-gray-700/95 overflow-hidden py-6"
      >
        {/* Background image layer */}
        <div
          className="absolute h-screen inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: `url(${"/images/lcupBg.png"})`,
            opacity: 0.33, // Adjust this value (0 to 1)
          }}
        />

        {/* Content layer */}
        <div className="flex isolate items-center gap-5 text-white lg:pl-20 flex-col w-full lg:flex-row">
          <div className="text-center lg:text-left sm:items-center">
            <h1 className="heading-step-1 font-bold">Need Guidance?</h1>
            <p className="py-6 text-step-1 font-light px-20 lg:px-0">
              Here at LCUP, our Social Welfare Services offers guidance either
              offline or online through SafeHub
            </p>

            <LoginButton />
          </div>
          <div className="flex items-center justify-center w-full ">
            <div className="w-[clamp(25rem,30vw,80rem)]">
              <svg
                className="hidden lg:block"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="11 6 34 29"
              >
                <path
                  d="M42.1458 16.2999C41.8639 17.6675 41.1933 18.9711 40.1321 20.0323L27.4993 32.6651L20.384 25.5499H26.928C29.7818 25.5494 31.4354 22.3167 29.7659 20.002L27.6672 17.0928C27.4288 16.7622 27.6649 16.3001 28.0725 16.2999H42.1458ZM29.6672 9.56744C32.5571 6.67756 37.2422 6.67756 40.1321 9.56744C41.1933 10.6287 41.864 11.9321 42.1458 13.2999H28.0725C25.2185 13.3001 23.5649 16.5329 25.2346 18.8477L27.3333 21.7569C27.5716 22.0874 27.3353 22.5494 26.928 22.5499H17.384L14.8665 20.0323C11.9769 17.1426 11.9771 12.4573 14.8665 9.56744C17.7563 6.67756 22.4424 6.67756 25.3323 9.56744L27.4993 11.7344L29.6672 9.56744Z"
                  fill="#059669"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
