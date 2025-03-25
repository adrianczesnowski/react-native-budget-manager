import { createContext, useContext, useState, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";

type NetworkContextType = {
  isConnected: boolean;
  addConnectivityListener: (callback: () => void) => () => void;
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectivityListeners, setConnectivityListeners] = useState<(() => void)[]>([]);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const currentlyConnected = state.isConnected ?? false;
      
      if (currentlyConnected && !isConnected) {
        setWasOffline(true);
        connectivityListeners.forEach(listener => listener());
      } else {
        setWasOffline(false);
      }
      
      setIsConnected(currentlyConnected);
    });

    return () => unsubscribe();
  }, [isConnected, connectivityListeners]);

  const addConnectivityListener = useCallback((callback: () => void) => {
    setConnectivityListeners(prev => [...prev, callback]);
    
    return () => {
      setConnectivityListeners(prev => 
        prev.filter(listener => listener !== callback)
      );
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ 
      isConnected, 
      addConnectivityListener 
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};