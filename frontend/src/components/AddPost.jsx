import { useRef, useState } from "react";
import { useAuthContext } from "../hooks/useContext/useAuthContext";
import { usePostContext } from "../hooks/useContext/usePostContext";
import { useAddPost } from "../hooks/useCRUD/useAddPost";

// images
import defaultProfile from "../assets/images/defaultProfile.png";

// icons
import { RxCross1 } from "react-icons/rx";
import { RiFileAddFill } from "react-icons/ri";
import { BsThreeDots } from "react-icons/bs";
import { FcStackOfPhotos } from "react-icons/fc";

// components
import Loading from "./Loading";
import Error from "./Error";

const AddPost = () => {
  const [imagePreviewSource, setImagePreviewSource] = useState("");
  const [isAddPostImage, setIsAddPostImage] = useState(true);
  const [postContent, setPostContent] = useState("");
  const { user } = useAuthContext();
  const { addPost, error, isPending } = useAddPost();
  const { dispatch } = usePostContext();
  const inputRef = useRef(null);

  const handleImageChange = (e) => {
    e.preventDefault();
    const image = e.target.files[0];
    previewImage(image);
  };

  const previewImage = (image) => {
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onloadend = () => {
      setImagePreviewSource(reader.result);
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const author = user._id;
    const postImage = imagePreviewSource ? imagePreviewSource : "";

    await addPost(author, postContent, postImage);

    dispatch({ type: "CLOSE_ADD_POST" });
  };

  return (
    <form
      className="fixed left-1/2 top-1/2 z-20 flex  w-[500px] -translate-x-1/2 -translate-y-1/2 flex-col  gap-4 rounded-lg bg-white p-4 shadow-lg"
      onSubmit={handleSubmit}
    >
      <header className="flex items-center justify-center border-b-[1px] border-zinc-200 pb-3">
        <h1 className="mx-auto text-2xl font-semibold"> Create Post </h1>
        <div
          className="flex cursor-pointer items-center justify-center rounded-full bg-zinc-100 p-2 hover:bg-zinc-200"
          onClick={() => {
            dispatch({ type: "CLOSE_ADD_POST" });
          }}
        >
          <RxCross1 className="text-xl text-zinc-600" />
        </div>
      </header>
      <section className="flex items-center gap-3">
        <div className="h-12 w-12 ">
          {user && (
            <img
              src={user.profileImg.url ? user.profileImg.url : defaultProfile}
              alt="odin book logo"
              className="h-full w-full rounded-full "
            />
          )}
        </div>

        <h2 className="font-semibold">
          {user.firstName} {user.lastName}
        </h2>
      </section>
      <textarea
        value={postContent}
        onChange={(e) => {
          setPostContent(e.target.value);
        }}
        placeholder="What's on your mind ?"
        className="resize-none text-lg outline-none"
      />

      {isAddPostImage && (
        <div
          className={`relative h-[250px] rounded-lg border-[1px] border-zinc-300 ${
            !imagePreviewSource ? "p-2" : "p-0"
          }`}
        >
          <div
            className="absolute right-[15px] top-[15px]  flex cursor-pointer items-center justify-center rounded-full border-[1px] bg-white p-1.5 font-medium hover:bg-zinc-200"
            onClick={() => {
              setImagePreviewSource("");
              setIsAddPostImage(false);
            }}
          >
            <RxCross1 className="text-zinc-600 " />
          </div>{" "}
          {imagePreviewSource && (
            <img
              src={imagePreviewSource}
              className="h-full w-full"
              alt="preview source"
            />
          )}
          {!imagePreviewSource && (
            <div
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded bg-zinc-100/50 hover:bg-zinc-200/50"
              onClick={() => inputRef.current.click()}
            >
              <div className="flex cursor-pointer items-center justify-center rounded-full bg-zinc-200 p-2">
                <RiFileAddFill className="text-2xl text-zinc-600" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-lg font-semibold">Add photos and videos</p>
                <p className="text-sm text-gray-500/90">or drag and drop</p>
              </div>
            </div>
          )}
          <input
            type="file"
            name="post_image"
            accept="image/*"
            onChange={(e) => handleImageChange(e)}
            ref={inputRef}
            className="hidden"
          />
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border-[1px] border-zinc-200 p-3">
        <p className="font-semibold">Add to your post</p>
        <FcStackOfPhotos
          className="mr-10 cursor-pointer text-3xl"
          onClick={() => {
            setIsAddPostImage((prevState) => !prevState);
          }}
        />
        <BsThreeDots className="cursor-pointer text-xl" />
      </div>

      {isPending && <Loading loadingColor={"#0066dd"} loadingSize={40} />}

      {!isPending && (
        <div
          className={`${postContent.length === 0 ? "cursor-not-allowed" : ""}`}
        >
          <button
            className={`${
              postContent.length === 0
                ? "pointer-events-none bg-zinc-200 text-zinc-400/50 "
                : "bg-blue-600 text-white hover:bg-blue-700/90"
            }  w-full  rounded py-1 text-lg  font-semibold transition duration-300`}
          >
            Post
          </button>
        </div>
      )}

      {error && <Error error={error} />}
    </form>
  );
};

export default AddPost;
