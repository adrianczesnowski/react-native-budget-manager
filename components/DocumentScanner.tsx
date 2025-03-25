import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useNetwork } from "../context/NetworkContext";

type DocumentScannerProps = {
  visible: boolean;
  onClose: () => void;
  onScan: (imageUri: string, title: string) => Promise<boolean | void>;
};

export default function DocumentScanner({
  visible,
  onClose,
  onScan,
}: DocumentScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isTitleStep, setIsTitleStep] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const { isConnected } = useNetwork();

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const takePicture = async () => {
    if (!isConnected) {
      Alert.alert(
        "Brak połączenia",
        "Skanowanie dokumentów wymaga połączenia z internetem",
        [{ text: "OK", onPress: onClose }]
      );
      return;
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo!.uri);
        setIsTitleStep(true);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Błąd", "Nie udało się zrobić zdjęcia. Spróbuj ponownie.");
      }
    }
  };

  const handleSave = async () => {
    if (capturedImage) {
      const success = await onScan(capturedImage, title || "Zeskanowany dokument");
      if (success) {
        setCapturedImage(null);
        setTitle("");
        setIsTitleStep(false);
        onClose();
      }
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setTitle("");
    setIsTitleStep(false);
    onClose();
  };

  if (!visible) return null;

  if (permission === null) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.container}>
          <Text>Oczekiwanie na uprawnienia kamery...</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Przyznaj uprawnienia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.buttonText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.container}>
          <Text style={styles.errorText}>Brak dostępu do kamery</Text>
          <Text>
            Aby skanować dokumenty, przyznaj aplikacji uprawnienia do kamery w
            ustawieniach urządzenia.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.buttonText}>Zamknij</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (isTitleStep && capturedImage) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Podaj nazwę dokumentu</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nazwa dokumentu"
            autoFocus
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Zapisz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={handleCameraReady}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close-outline" size={30} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerText}>Zeskanuj dokument</Text>
              <View style={{ width: 30 }} />
            </View>

            <View style={styles.guideFrame} />

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 10,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 18,
    color: Colors.red,
    marginBottom: 10,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 50,
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  guideFrame: {
    marginHorizontal: 30,
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  cameraControls: {
    alignItems: "center",
    marginBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
});
