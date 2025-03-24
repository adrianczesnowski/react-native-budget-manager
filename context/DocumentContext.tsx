import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../utils/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useAuth } from "./AuthContext";
import { useNetwork } from "./NetworkContext";

export type Document = {
  id: string;
  title: string;
  imageUri: string;
  cloudUri: string;
  date: string;
  synced: boolean;
  createdAt: number;
};

type DocumentContextType = {
  documents: Document[];
  loading: boolean;
  error: string | null;
  pendingSyncCount: number;
  addDocument: (document: {
    title: string;
    imageUri: string;
    date: string;
  }) => Promise<void>;
  getDocumentById: (id: string) => Promise<Document | null>;
  getDocuments: () => Promise<void>;
  syncDocuments: () => Promise<void>;
  saveDocumentToDevice: (document: Document) => Promise<string>;
};

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const { user } = useAuth();
  const { isConnected } = useNetwork();

  useEffect(() => {
    if (user) {
      getDocuments();
      countPendingSync();
    }
  }, [user]);

  useEffect(() => {
    if (isConnected && pendingSyncCount > 0) {
      syncDocuments();
    }
  }, [isConnected, pendingSyncCount]);

  const countPendingSync = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter((key) =>
        key.startsWith("pending_document_")
      );
      setPendingSyncCount(pendingKeys.length);
    } catch (error) {
      console.error("Error counting pending document syncs:", error);
    }
  };

  const getDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const localDocuments = await getLocalDocuments();

      if (isConnected) {
        const q = query(
          collection(firestore, "users", user.uid, "documents"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const cloudDocuments = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              synced: true,
            }) as Document
        );

        const pendingIds = localDocuments
          .filter((d) => !d.synced)
          .map((d) => d.id);

        const mergedDocuments = [
          ...localDocuments.filter((d) => !d.synced),
          ...cloudDocuments.filter((d) => !pendingIds.includes(d.id)),
        ];

        setDocuments(mergedDocuments);

        await AsyncStorage.setItem(
          "documents",
          JSON.stringify(mergedDocuments)
        );
      } else {
        setDocuments(localDocuments);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocalDocuments = async (): Promise<Document[]> => {
    try {
      const documentsJson = await AsyncStorage.getItem("documents");
      if (documentsJson) {
        return JSON.parse(documentsJson);
      }
      return [];
    } catch (error) {
      console.error("Error getting local documents:", error);
      return [];
    }
  };

  const getDocumentById = async (id: string): Promise<Document | null> => {
    try {
      const localDocuments = await getLocalDocuments();
      const localDocument = localDocuments.find((d) => d.id === id);

      if (localDocument) {
        return localDocument;
      }

      if (user && isConnected) {
        const docRef = doc(firestore, "users", user.uid, "documents", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data(),
            synced: true,
          } as Document;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting document by ID:", error);
      return null;
    }
  };

  const addDocument = async (document: {
    title: string;
    imageUri: string;
    date: string;
  }) => {
    if (!user) return;

    try {
      const newDocument: Document = {
        ...document,
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        cloudUri: "",
        synced: false,
        createdAt: Date.now(),
      };

      const localDir = FileSystem.documentDirectory + "documents/";
      const dirInfo = await FileSystem.getInfoAsync(localDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
      }

      const localPath = localDir + newDocument.id + ".jpg";
      await FileSystem.copyAsync({
        from: document.imageUri,
        to: localPath,
      });

      newDocument.imageUri = localPath;

      const updatedDocuments = [newDocument, ...documents];
      setDocuments(updatedDocuments);
      await AsyncStorage.setItem("documents", JSON.stringify(updatedDocuments));

      await AsyncStorage.setItem(
        `pending_document_${newDocument.id}`,
        JSON.stringify(newDocument)
      );

      setPendingSyncCount((prev) => prev + 1);

      if (isConnected) {
        await syncDocument(newDocument);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const syncDocument = async (document: Document) => {
    if (!user || !isConnected) return;

    try {
      const response = await fetch(document.imageUri);
      const blob = await response.blob();

      const storageRef = ref(
        storage,
        `users/${user.uid}/documents/${document.id}.jpg`
      );
      await uploadBytes(storageRef, blob);

      const cloudUri = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, "users", user.uid, "documents"), {
        title: document.title,
        cloudUri,
        date: document.date,
        createdAt: document.createdAt,
        synced: true,
      });

      const updatedDocuments = documents.map((d) =>
        d.id === document.id ? { ...d, cloudUri, synced: true } : d
      );

      setDocuments(updatedDocuments);
      await AsyncStorage.setItem("documents", JSON.stringify(updatedDocuments));

      await AsyncStorage.removeItem(`pending_document_${document.id}`);
      setPendingSyncCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error syncing document:", error);
    }
  };

  const syncDocuments = async () => {
    if (!user || !isConnected) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter((key) =>
        key.startsWith("pending_document_")
      );

      for (const key of pendingKeys) {
        const documentJson = await AsyncStorage.getItem(key);
        if (documentJson) {
          const document = JSON.parse(documentJson) as Document;
          await syncDocument(document);
        }
      }

      await getDocuments();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const saveDocumentToDevice = async (document: Document): Promise<string> => {
    try {
      const fileUri = document.imageUri;
      const fileName = document.title + ".jpg";

      const destUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({
        from: fileUri,
        to: destUri,
      });

      return destUri;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        error,
        pendingSyncCount,
        addDocument,
        getDocumentById,
        getDocuments,
        syncDocuments,
        saveDocumentToDevice,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
}
