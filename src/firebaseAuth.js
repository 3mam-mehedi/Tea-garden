
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export const loginAnonymously = async () => {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    const user = await new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          unsubscribe();

          if (currentUser) {
            resolve(currentUser);
          } else {
            try {
              const result = await signInAnonymously(auth);
              resolve(result.user);
            } catch (error) {
              reject(error);
            }
          }
        },
        reject
      );
    });

    console.log("Firebase connected:", user.uid);
    return user;
  } catch (error) {
    console.error("Firebase Authentication Error:", error);
    throw error;
  }
};
