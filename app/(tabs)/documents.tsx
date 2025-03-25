import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDocuments } from "../../context/DocumentContext";
import DocumentScanner from "../../components/DocumentScanner";
import { useNetwork } from "../../context/NetworkContext";
import Colors from "../../constants/Colors";

export default function DocumentsScreen() {
  const { documents, loading, scanDocument, deleteDocument } = useDocuments();
  const { isConnected } = useNetwork();
  const [scannerVisible, setScannerVisible] = useState(false);

  const handleScan = async (imageUri: string, title: string) => {
    await scanDocument(imageUri, title);
  };

  const openScanner = () => {
    if (!isConnected) {
      Alert.alert(
        "Brak połączenia",
        "Skanowanie dokumentów wymaga połączenia z internetem",
        [{ text: "OK" }]
      );
      return;
    }

    setScannerVisible(true);
  };

  const handleViewDocument = (id: string) => {
    router.push(`/document-details/${id}`);
  };

  const handleLongPress = (document: {
    id: any;
    title: any;
    imageUri?: string;
    date?: string;
    synced?: boolean;
    createdAt?: number;
  }) => {
    Alert.alert(
      "Usuń dokument",
      `Czy na pewno chcesz usunąć dokument "${document.title}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            const success = await deleteDocument(document.id);
            if (success) {
              
            } else {
              Alert.alert("Błąd", "Nie udało się usunąć dokumentu");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dokumenty</Text>

      {documents.length > 0 ? (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.documentCard}
              onPress={() => handleViewDocument(item.id)}
              onLongPress={() => handleLongPress(item)}
              delayLongPress={500}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={styles.documentImage}
                resizeMode="cover"
              />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.documentDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Brak dokumentów</Text>
          <Text style={styles.emptySubtext}>
            Zeskanuj dokumenty, aby dodać je tutaj
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
            <Text style={styles.scanButtonText}>Zeskanuj dokument</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={openScanner}>
        <Ionicons name="camera" size={24} color="white" />
      </TouchableOpacity>

      <DocumentScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    paddingBottom: 80,
  },
  documentCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  documentImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  documentInfo: {
    padding: 12,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  documentDate: {
    fontSize: 12,
    color: "#888",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  offlineText: {
    marginTop: 8,
    color: Colors.red,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
