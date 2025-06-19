// import { create, Mutate, StoreApi } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { AIModel, getModelConfig, ModelConfig } from '@/lib/models';

// type ModelStore = {
//   selectedModel: AIModel;
//   setModel: (model: AIModel) => void;
//   getModelConfig: () => ModelConfig;
// };

// type StoreWithPersist = Mutate<
//   StoreApi<ModelStore>,
//   [['zustand/persist', { selectedModel: AIModel }]]
// >;

// export const withStorageDOMEvents = (store: StoreWithPersist) => {
//   const storageEventCallback = (e: StorageEvent) => {
//     if (e.key === store.persist.getOptions().name && e.newValue) {
//       store.persist.rehydrate();
//     }
//   };

//   window.addEventListener('storage', storageEventCallback);

//   return () => {
//     window.removeEventListener('storage', storageEventCallback);
//   };
// };

// export const useModelStore = create<ModelStore>()(
//   persist(
//     (set, get) => ({
//       selectedModel: 'Deepseek R1 0528', // Default model

//       setModel: (model) => {
//         set({ selectedModel: model });
//       },

//       getModelConfig: () => {
//         const { selectedModel } = get();
//         return getModelConfig(selectedModel);
//       },
//     }),
//     {
//       name: 'selected-model',
//       partialize: (state) => ({ selectedModel: state.selectedModel }),
//     }
//   )
// );

// withStorageDOMEvents(useModelStore);

import { create, Mutate, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModel, getModelConfig, ModelConfig } from '@/lib/models';

type ModelStore = {
  // Legacy single model support (for backward compatibility)
  selectedModel: AIModel;
  setModel: (model: AIModel) => void;
  getModelConfig: () => ModelConfig;
  
  // New multi-model support
  selectedModels: AIModel[];
  isMultiModelMode: boolean;
  
  // Multi-model actions
  toggleModel: (model: AIModel) => void;
  setMultiModelMode: (enabled: boolean) => void;
  selectAllModels: () => void;
  clearAllModels: () => void;
  selectSingleModel: (model: AIModel) => void;
  
  // Helpers
  isModelSelected: (model: AIModel) => boolean;
  getSelectedModelsCount: () => number;
  getEnabledModels: () => AIModel[];
};

type StoreWithPersist = Mutate<
  StoreApi<ModelStore>,
  [['zustand/persist', { 
    selectedModel: AIModel; 
    selectedModels: AIModel[];
    isMultiModelMode: boolean;
  }]]
>;

export const withStorageDOMEvents = (store: StoreWithPersist) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist.getOptions().name && e.newValue) {
      store.persist.rehydrate();
    }
  };

  window.addEventListener('storage', storageEventCallback);

  return () => {
    window.removeEventListener('storage', storageEventCallback);
  };
};

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      // Legacy single model (default)
      selectedModel: 'Deepseek R1 0528',
      
      // New multi-model state
      selectedModels: ['Deepseek R1 0528'],
      isMultiModelMode: false,

      // Legacy methods (backward compatibility)
      setModel: (model) => {
        set({ 
          selectedModel: model,
          selectedModels: [model], // Keep in sync
          isMultiModelMode: false
        });
      },

      getModelConfig: () => {
        const { selectedModel } = get();
        return getModelConfig(selectedModel);
      },

      // New multi-model methods
      toggleModel: (model) => {
        const { selectedModels } = get();
        const isSelected = selectedModels.includes(model);
        
        if (isSelected) {
          // Remove model (but keep at least one)
          const newModels = selectedModels.filter(m => m !== model);
          if (newModels.length === 0) return; // Don't allow empty selection
          
          set({ 
            selectedModels: newModels,
            selectedModel: newModels[0], // Update primary selection
          });
        } else {
          // Add model
          const newModels = [...selectedModels, model];
          set({ 
            selectedModels: newModels,
            selectedModel: model, // Update primary selection to newly added
          });
        }
      },

      setMultiModelMode: (enabled) => {
        set({ isMultiModelMode: enabled });
      },

      selectAllModels: () => {
        // Import AI_MODELS here or pass as parameter
        // For now, we'll get enabled models from the helper
        const enabledModels = get().getEnabledModels();
        set({ 
          selectedModels: enabledModels,
          selectedModel: enabledModels[0] || 'Deepseek R1 0528',
        });
      },

      clearAllModels: () => {
        const { selectedModel } = get();
        set({ 
          selectedModels: [selectedModel], // Keep current primary model
        });
      },

      selectSingleModel: (model) => {
        set({ 
          selectedModel: model,
          selectedModels: [model],
          isMultiModelMode: false
        });
      },

      // Helper methods
      isModelSelected: (model) => {
        const { selectedModels } = get();
        return selectedModels.includes(model);
      },

      getSelectedModelsCount: () => {
        const { selectedModels } = get();
        return selectedModels.length;
      },

      getEnabledModels: () => {
        // This will need access to AI_MODELS and API key store
        // We'll implement this in the component level for now
        return get().selectedModels;
      },
    }),
    {
      name: 'selected-model',
      partialize: (state) => ({ 
        selectedModel: state.selectedModel,
        selectedModels: state.selectedModels,
        isMultiModelMode: state.isMultiModelMode,
      }),
    }
  )
);

withStorageDOMEvents(useModelStore);