import { motion } from 'framer-motion';
import { useGame } from './context/GameContext';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { MainScreen } from './components/screens/MainScreen';
import { AwardsScreen } from './components/screens/AwardsScreen';
import { QuizEditorScreen } from './components/screens/QuizEditorScreen';

const enter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15 },
};

export default function App() {
  const { state } = useGame();

  return (
    <div className="min-h-screen bg-bg-primary">
      {state.screen === 'settings' && (
        <motion.div key="settings" {...enter}>
          <SettingsScreen />
        </motion.div>
      )}
      {state.screen === 'playing' && (
        <motion.div key="playing" {...enter}>
          <MainScreen />
        </motion.div>
      )}
      {state.screen === 'awards' && (
        <motion.div key="awards" {...enter}>
          <AwardsScreen />
        </motion.div>
      )}
      {state.screen === 'editor' && (
        <motion.div key="editor" {...enter}>
          <QuizEditorScreen />
        </motion.div>
      )}
    </div>
  );
}
