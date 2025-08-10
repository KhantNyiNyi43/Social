import fs from "fs";
import imagekit from "../config/imagekit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

    let image_urls = [];

    if (images.length) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);
          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });
          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "512" },
            ],
          });
          return url
        })
      );
    }
    await Post.create({
        user: userId,
        content,
        image_urls,
        post_type
    })
    res.json({success : true, message: "Post Created Successfully"})
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}
//Get Posts;
export const getFeedPosts=async(req,res)=>{
  try{
    const {userId}=req.auth()
    const user = await User.findById(userId)

    //User connections and followings
     const connections = Array.isArray(user.connections) ? user.connections : [];
    const following = Array.isArray(user.following) ? user.following : [];

    const userIds = [userId, ...connections, ...following];
    
    const posts =await Post.find({user: {$in: userIds}}).populate('user').sort({createdAt: -1});

    res.json({success:true, posts })
  }catch (error){
    console.log(error);
    res.json({success:false, message:error.message});
  }
}
// Like Post
export const likePost =async(req,res)=>{
  try{
    const {userId}=req.auth()
    const {postId}=req.body;

    const post =await Post.findById(postId)

    if(post.likes_count.includes(userId)){
      post.likes_count = post.likes_count.filter(user => user !== userId)
      await post.save()
      res.json({success: true, message:'Post unliked'});
    }else{
      post.likes_count.push(userId)
      await post.save()
      res.json({success: true, message:'Post liked'});
    }


  }catch (error){
    console.log(error);
    res.json({success:false, message:error.message});
  }
}
