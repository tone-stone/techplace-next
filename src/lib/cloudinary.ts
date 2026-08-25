import { v2 as cloudinary } from "cloudinary";

// Reads CLOUDINARY_URL from the environment automatically.
cloudinary.config({ secure: true });

export default cloudinary;
