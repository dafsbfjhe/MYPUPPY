/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

/**
 * 카카오 사용자 ID를 받아 Firebase Custom Token을 생성합니다.
 */
export const createKakaoCustomToken = onRequest(
  {cors: true},
  async (request, response) => {
    // POST 요청만 허용
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const kakaoUserId = request.body.kakaoUserId;

    if (!kakaoUserId) {
      logger.error("kakaoUserId is missing in request body");
      response.status(400).send("Bad Request: kakaoUserId is required");
      return;
    }

    try {
    // Firebase Custom Token 생성
      const firebaseToken = await admin.auth()
        .createCustomToken(kakaoUserId.toString());

      logger.info(
        `Successfully created custom token for kakao user: ${kakaoUserId}`
      );

      response.status(200).json({
        token: firebaseToken,
      });
    } catch (error) {
      logger.error("Error creating custom token:", error);
      response.status(500).send("Internal Server Error");
    }
  });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
