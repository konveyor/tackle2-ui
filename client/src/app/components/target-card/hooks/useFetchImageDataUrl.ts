import { useEffect, useState } from "react";
import axios from "axios";

import { Target } from "@app/api/models";
import { FILES } from "@app/api/rest";
import DefaultImage from "@app/images/Icon-Red_Hat-Virtual_server_stack-A-Black-RGB.svg";

const useFetchImageDataUrl = (target: Target) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const imagePath = target?.image?.id
      ? `${FILES}/${target?.image.id}`
      : DefaultImage;

    (async () => {
      try {
        const response = await axios.get(imagePath, {
          headers: {
            Accept: "application/octet-stream",
          },
          responseType: "arraybuffer",
        });
        const contentType = response.headers["content-type"];

        let imageData;

        if (contentType === "image/svg+xml") {
          const text = new TextDecoder().decode(response.data);
          imageData = `data:${contentType},${encodeURIComponent(text)}`;
        } else {
          const base64 = btoa(
            new Uint8Array(response.data).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          imageData = `data:${contentType};base64,${base64}`;
        }

        setImageDataUrl(imageData);
      } catch (error) {
        console.error("There was an issue fetching the image:", error);
      }
    })();
  }, [target]);

  return imageDataUrl;
};

export default useFetchImageDataUrl;
