package localbuddy.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long IMAGE_MAX_BYTES = 5L * 1024L * 1024L;
    private static final long VIDEO_MAX_BYTES = 30L * 1024L * 1024L;

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String folder) {
        validateMultipart(file, IMAGE_MAX_BYTES, "jpg", "jpeg", "png", "webp");
        return uploadBytes(readBytes(file), folder, "image");
    }

    public String uploadVideo(MultipartFile file, String folder) {
        validateMultipart(file, VIDEO_MAX_BYTES, "mp4", "webm");
        return uploadBytes(readBytes(file), folder, "video");
    }

    public String uploadBase64Image(String base64, String folder) {
        if (!StringUtils.hasText(base64)) {
            throw new IllegalArgumentException("Image data is required.");
        }
        String mediaType = detectDataUriMediaType(base64);
        if (mediaType != null && !isAllowedImageMediaType(mediaType)) {
            throw new IllegalArgumentException("Only jpg, jpeg, png, and webp images are allowed.");
        }
        return uploadBytes(base64, folder, "image");
    }

    public static boolean isBase64DataUri(String value) {
        return StringUtils.hasText(value) && value.startsWith("data:") && value.contains(";base64,");
    }

    public String uploadBase64ImageIfNeeded(String value, String folder) {
        if (!isBase64DataUri(value)) {
            return value;
        }
        return uploadBase64Image(value, folder);
    }

    private void validateMultipart(MultipartFile file, long maxBytes, String... allowedExtensions) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file is required.");
        }
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("File is too large.");
        }

        String extension = getExtension(file.getOriginalFilename());
        boolean allowed = false;
        for (String allowedExtension : allowedExtensions) {
            if (allowedExtension.equals(extension)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            throw new IllegalArgumentException("Unsupported file type.");
        }
    }

    private String uploadBytes(Object file, String folder, String resourceType) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file, ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType
            ));
            Object secureUrl = result.get("secure_url");
            if (secureUrl == null || !StringUtils.hasText(secureUrl.toString())) {
                throw new IllegalStateException("Cloudinary did not return a secure URL.");
            }
            return secureUrl.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Unable to read upload file.", e);
        }
    }

    private String getExtension(String filename) {
        if (!StringUtils.hasText(filename) || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private String detectDataUriMediaType(String base64) {
        int prefixEnd = base64.indexOf(";base64,");
        if (!base64.startsWith("data:") || prefixEnd <= 5) {
            return null;
        }
        return base64.substring(5, prefixEnd).toLowerCase(Locale.ROOT);
    }

    private boolean isAllowedImageMediaType(String mediaType) {
        return mediaType.equals("image/jpeg")
                || mediaType.equals("image/jpg")
                || mediaType.equals("image/png")
                || mediaType.equals("image/webp");
    }
}
