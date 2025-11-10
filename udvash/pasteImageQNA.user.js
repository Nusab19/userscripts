// ==UserScript==
// @name         Udvash - Paste Image in QNA
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Upload images via Ctrl+V paste
// @author       You
// @match        https://online.udvash-unmesh.com/QnA/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  document.addEventListener("paste", async (e) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();

        const blob = items[i].getAsFile();
        const formData = new FormData();

        formData.append("QnA2CourseId", "4");
        formData.append("SubjectId", "");
        formData.append("QnA2ChapterId", "");
        formData.append("ThreadExternalId", "0");
        formData.append("ThreadDetailsExternalId", "0");
        formData.append("Details[0].FileOrder", "1");
        formData.append("Details[0].ThreadExternalId", "0");
        formData.append("Details[0].ThreadDetailsExternalId", "0");
        formData.append("Details[0].UploadedFile", blob, "pasted-image.jpg");

        const token = gettoken();
        console.log("Token found:", token.substring(0, 20) + "...");
        formData.append("__RequestVerificationToken", token);

        try {
          const response = await fetch(
            "https://online.udvash-unmesh.com/QnA/UploadFiles",
            {
              method: "POST",
              headers: {
                "X-Requested-With": "XMLHttpRequest",
              },
              body: formData,
              credentials: "include",
            },
          );

          console.log("Response status:", response.status);
          const text = await response.text();
          console.log("Response text:", text);

          if (response.ok) {
            try {
              const result = JSON.parse(text);
              console.log("Upload successful:", result);

              if (result && result.length > 0 && result[0].IsSuccess) {
                const fileData = result[0];
                const imageUrl =
                  fileData.BaseUrlAlice + "/" + fileData.FilePath;
                const fileOrder = fileData.FileOrder;
                const guidTick = fileData.GuidTick;
                const filePath = fileData.FilePath;

                const container = document.querySelector(
                  ".image-audio-pdf.connected-sortable",
                );
                const hr = document.querySelector("#hr_0_0");

                if (container) {
                  container.classList.remove("d-none");
                  if (hr) {
                    hr.classList.remove("d-none");
                    hr.classList.add("d-flex");
                  }

                  const imageHtml = `
                                        <div>
                                            <div class="position-relative question_form_attachment question-attachment-success" id="question_form_attachment_0_0_${fileOrder}" data-file-order="${fileOrder}" data-ext-id="0" data-ext-details-id="0" data-ext-details-attachment-id="0" data-key="${filePath}" data-guidtick="${guidTick}">
                                                <div data-toggle="modal" data-target="#imgModal_0_0_${fileOrder}" role="button">
                                                    <img src="${imageUrl}" class="img-fluid modal-item" height="50" width="50">
                                                </div>
                                                <span class="position-absolute new-files-drag"><img src="/Content/UmsTheme/assets/lib/CropperJs/icons/drag.png" alt="Drag btn"></span>
                                                <span class="position-absolute close new-files-close"><img src="/Content/UmsTheme/assets/lib/CropperJs/icons/Close-02.png" alt="close modal"></span>
                                                <div class="cropRotateEditBtn position-absolute">
                                                    <button type="button" class="imgEditBtn bg-transparent" data-toggle="modal" data-target="#imgModal_0_0_${fileOrder}"><img src="/Content/UmsTheme/assets/lib/CropperJs/icons/Crop.png" alt="Edit btn"></button>
                                                    <button type="button" class="p-0 shadow-none bg-transparent cp-rotate-left" data-toggle="modal" data-target="#imgModal_0_0_${fileOrder}" data-method="rotate" data-option="-90" title="Rotate Left">
                                                        <span class="docs-tooltip" data-toggle="tooltip" title="">
                                                            <img src="/Content/UmsTheme/assets/lib/CropperJs/icons/RotateLeft.png" alt="left rotate button">
                                                        </span>
                                                    </button>
                                                    <button type="button" class="p-0 shadow-none bg-transparent cp-rotate-right" data-toggle="modal" data-target="#imgModal_0_0_${fileOrder}" data-method="rotate" data-option="90" title="Rotate Right">
                                                        <span class="docs-tooltip" data-toggle="tooltip" title="">
                                                            <img src="/Content/UmsTheme/assets/lib/CropperJs/icons/RotateRight.png" alt="right rotate button">
                                                        </span>
                                                    </button>
                                                </div>
                                                <progress class="position-absolute new-file-progress" value="100" max="100"> 100% </progress>
                                            </div>
                                        </div>
                                    `;

                  container.insertAdjacentHTML("beforeend", imageHtml);
                  console.log("Image added to container:", imageUrl);
                } else {
                  console.error("Container not found");
                }
              }
            } catch (err) {
              console.error("JSON parse error:", err);
            }
          } else {
            console.error("Upload failed with status:", response.status);
          }
        } catch (error) {
          console.error("Upload failed:", error);
        }

        break;
      }
    }
  });

  console.log("Paste image upload script loaded");
})();
