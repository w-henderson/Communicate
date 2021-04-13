import React from "react";

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

export interface FirebaseUtils {
  auth: firebase.auth.Auth,
  database: firebase.database.Database,
  storage: firebase.storage.Storage,
  user: User | null
}

export default React.createContext<FirebaseUtils | undefined>(undefined);