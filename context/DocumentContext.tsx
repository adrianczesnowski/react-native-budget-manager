import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";

export type Document = {
  id: string;
  title: string;
  imageUri: string;
  date: string;
  synced: boolean;
  createdAt: number;
};

type DocumentContextType = {
  documents: Document[];
  loading: boolean;
  error: string | null;
  addDocument: (document: {
    title: string;
    imageUri: string;
    date: string;
  }) => Promise<boolean>;
  getDocumentById: (id: string) => Promise<Document | null>;
  getDocuments: () => Promise<void>;
  scanDocument: (imageUri: string, title: string) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
};

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getDocuments();
    }
  }, [user]);

  const getDocuments = async () => {
    setLoading(true);
    try {
      const docsJson = await AsyncStorage.getItem("documents");
      if (docsJson) {
        setDocuments(JSON.parse(docsJson));
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocalDocuments = async (): Promise<Document[]> => {
    try {
      const docsJson = await AsyncStorage.getItem("documents");
      return docsJson ? JSON.parse(docsJson) : [];
    } catch (error) {
      console.error("Error getting local documents:", error);
      return [];
    }
  };

  const getDocumentById = async (id: string): Promise<Document | null> => {
    try {
      const docs = await getLocalDocuments();
      return docs.find(doc => doc.id === id) || null;
    } catch (error) {
      console.error("Error getting document by ID:", error);
      return null;
    }
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      const currentDocs = await getLocalDocuments();
      const docToDelete = currentDocs.find(doc => doc.id === id);
      
      if (!docToDelete) return false;
      
      try {
        if (docToDelete.imageUri) {
          await FileSystem.deleteAsync(docToDelete.imageUri, { idempotent: true });
        }
      } catch (fileError) {
        console.error("Error deleting file:", fileError);
      }
      
      const updatedDocs = currentDocs.filter(doc => doc.id !== id);
      
      setDocuments(updatedDocs);
      await AsyncStorage.setItem("documents", JSON.stringify(updatedDocs));
      
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  };

  const saveLocalImage = async (sourceUri: string): Promise<string> => {
    try {
      const documentDir = FileSystem.documentDirectory + "documents/";
      
      const dirInfo = await FileSystem.getInfoAsync(documentDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentDir, { intermediates: true });
      }
      
      const filename = `document_${Date.now()}.jpg`;
      const destinationUri = documentDir + filename;
      
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri
      });
      
      return destinationUri;
    } catch (error) {
      console.error("Error saving local image:", error);
      throw error;
    }
  };

  const scanDocument = async (
    imageUri: string,
    title: string
  ): Promise<boolean> => {
    if (!user) {
      Alert.alert("Błąd", "Nie jesteś zalogowany");
      return false;
    }

    setLoading(true);

    try {
      const savedImageUri = await saveLocalImage(imageUri);
      
      const newDoc: Document = {
        id: `local_${Date.now()}`,
        title: title || "Zeskanowany dokument",
        imageUri: savedImageUri,
        date: new Date().toISOString(),
        createdAt: Date.now(),
        synced: false
      };

      const currentDocs = await getLocalDocuments();
      const updatedDocs = [newDoc, ...currentDocs];
      
      setDocuments(updatedDocs);
      await AsyncStorage.setItem("documents", JSON.stringify(updatedDocs));
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error scanning document:", error);
      setLoading(false);
      Alert.alert(
        "Błąd",
        "Nie udało się zeskanować dokumentu. Spróbuj ponownie."
      );
      return false;
    }
  };

  const addDocument = async (document: {
    title: string;
    imageUri: string;
    date: string;
  }) => {
    return scanDocument(document.imageUri, document.title);
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        error,
        addDocument,
        getDocumentById,
        getDocuments,
        scanDocument,
        deleteDocument,
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