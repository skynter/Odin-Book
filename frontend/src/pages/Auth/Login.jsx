import { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";
import { useDemoAccountLogin } from "../../hooks/useLoginDemoAccount";

// images
import logo from "../../assets/images/odin-book.png";
import auth_image from "../../assets/images/auth_image.jpg";

// icons
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { TfiUser } from "react-icons/tfi";

// components
import Loading from "../../components/Loading";
import Error from "../../components/Error";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const { login, isPending, error } = useLogin();
  const { demoAccountLogin, isDemoPending, demoError } = useDemoAccountLogin();

  const toggleShowPassword = () => {
    setPasswordShown(!passwordShown);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await login(email, password);
  };

  return (
    <div className="flex h-screen">
      <section className="w-[35%]">
        <div className="flex h-full flex-col items-center justify-center gap-3 px-28">
          <img src={logo} className="h-32 w-32" />

          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold text-darkBlue">Login</h1>
            <h2 className="text-darkblue text-lg opacity-50">
              To meet the world.{" "}
            </h2>
          </div>

          <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
            <label className="auth_label">
              <span className="auth_label_text">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth_input"
              />
            </label>
            <label className="auth_label relative">
              <span className="auth_label_text">Password</span>
              <input
                type={passwordShown ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth_input"
              />
              {passwordShown && (
                <AiFillEyeInvisible
                  className="absolute right-3 top-[38px] cursor-pointer text-xl text-mainBlue opacity-50"
                  onClick={toggleShowPassword}
                />
              )}
              {!passwordShown && (
                <AiFillEye
                  className="absolute right-3 top-[38px] cursor-pointer text-xl text-mainBlue opacity-50"
                  onClick={toggleShowPassword}
                />
              )}
            </label>

            <button className="auth_btn mt-6">
              {isPending && <Loading loadingColor={"white"} />}
              {!isPending && <span>Login</span>}
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded border-[1px] border-mainBlue bg-white py-[8px] font-medium transition-all duration-300 ease-in-out hover:bg-[#f8fafd]"
              onClick={demoAccountLogin}
            >
              {isDemoPending && <Loading loadingColor={"#0066dd"} />}
              {!isDemoPending && (
                <>
                  <TfiUser className="text-lg text-mainBlue" />
                  <span>Try a demo account</span>
                </>
              )}
            </button>

            {error && (
              <Error
                error={error}
                errorSize={"text-lg"}
                errorColor={"text-mainBlue"}
              />
            )}
            {demoError && (
              <Error
                error={demoError}
                errorSize={"text-lg"}
                errorColor={"text-mainBlue"}
              />
            )}
          </form>

          <p className="pt-2 text-[15px]">
            <span className="opacity-80">Don't have an account? </span>

            <Link to="/signup" className="font-[450] text-mainBlue">
              Register
            </Link>
          </p>
        </div>
      </section>
      <img src={auth_image} className="w-[65%]" />{" "}
    </div>
  );
};

export default Login;
