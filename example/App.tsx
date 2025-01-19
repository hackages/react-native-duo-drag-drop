/* eslint-disable react-native/no-inline-styles */
import "react-native-gesture-handler";
import { useRef, useState } from "react";
import { StyleSheet, View, Text, Button, SafeAreaView, Modal, Pressable, TouchableOpacity } from "react-native";
import DuoDragDrop, { Word, Placeholder, Lines } from "@jamsch/react-native-duo-drag-drop";
import type { DuoDragDropRef, DuoAnimatedStyleWorklet } from "@jamsch/react-native-duo-drag-drop";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { withSpring, withTiming } from "react-native-reanimated";

const customAnimatedStyle: DuoAnimatedStyleWorklet = (style, isGestureActive) => {
  "worklet";
  // Scale the word when the gesture is active
  style.transform.push({
    scale: withTiming(isGestureActive ? 1.5 : 1, { duration: 200 }),
  });
  style.opacity = withTiming(isGestureActive ? 0.8 : 1, { duration: 200 });
  style.top = withTiming(isGestureActive ? -10 : 0, { duration: 200 });

  // Apply a spring when the word moves to it's destination
  if (!isGestureActive) {
    style.transform[0].translateX = withSpring(style.transform[0].translateX);
    style.transform[1].translateY = withSpring(style.transform[1].translateY);
  }

  return style;
};

type Question = {
  id: number;
  question: string;
  words: string[];
  correctAnswer: string[];
};

type Answer = {
  question: string;
  userAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What does IT stand for?",
    words: ["Technique", "Intelligence", "Technology", "Info", "Information"],
    correctAnswer: ["Information", "Technology"],
  },
  {
    id: 2,
    question: "What does AI stand for?",
    words: ["Artificial", "Advanced", "Intelligence", "Interface", "Internal"],
    correctAnswer: ["Artificial", "Intelligence"],
  },
  {
    id: 3,
    question: "What does UI stand for?",
    words: ["User", "Utility", "Interface", "Internal", "Integration"],
    correctAnswer: ["User", "Interface"],
  },
  {
    id: 4,
    question: "What does API stand for?",
    words: ["Application", "Programming", "Interface", "Program", "Active"],
    correctAnswer: ["Application", "Programming", "Interface"],
  },
  {
    id: 5,
    question: "What does URL stand for?",
    words: ["Uniform", "Resource", "Locator", "Universal", "Link"],
    correctAnswer: ["Uniform", "Resource", "Locator"],
  },
];

export default function App() {
  const duoDragDropRef = useRef<DuoDragDropRef>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const currentQuestion = QUESTIONS[currentQuestionIndex];

  const validateAnswer = () => {
    const currentAnswer = duoDragDropRef.current?.getAnsweredWords() || [];
    const isAnswerCorrect = currentQuestion.correctAnswer.join(' ') === currentAnswer.join(' ');
    
    // Store the answer
    setAnswers(prev => [...prev, {
      question: currentQuestion.question,
      userAnswer: currentAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: isAnswerCorrect
    }]);
    
    setIsCorrect(isAnswerCorrect);
    setShowModal(true);
  };

  const handleNextQuestion = () => {
    setShowModal(false);
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const ResultsDashboard = () => {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    
    return (
      <ScrollView style={styles.dashboardContainer}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Quiz Complete! 🎉</Text>
          <Text style={styles.scoreText}>
            Score: {correctAnswers}/{QUESTIONS.length}
          </Text>
        </View>
        
        {answers.map((answer, index) => (
          <View key={index} style={styles.answerCard}>
            <Text style={styles.questionNumber}>Question {index + 1}</Text>
            <Text style={styles.dashboardQuestion}>{answer.question}</Text>
            
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <Text style={[
                styles.answerText,
                { color: answer.isCorrect ? '#4CAF50' : '#f44336' }
              ]}>
                {answer.userAnswer.join(' ') || 'No answer provided'}
              </Text>
            </View>
            
            {!answer.isCorrect && (
              <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Correct Answer:</Text>
                <Text style={[styles.answerText, { color: '#4CAF50' }]}>
                  {answer.correctAnswer.join(' ')}
                </Text>
              </View>
            )}
            
            <View style={styles.resultBadge}>
              {answer.isCorrect ? 
                <Text style={[styles.badgeText, { color: '#4CAF50' }]}>✓ Correct</Text> :
                <Text style={[styles.badgeText, { color: '#f44336' }]}>✗ Incorrect</Text>
              }
            </View>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.restartButton}
          onPress={() => {
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setIsComplete(false);
          }}
        >
          <Text style={styles.restartButtonText}>Restart Quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {!isComplete ? (
          <ScrollView>
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <View style={styles.questionCard}>
                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>
              </View>
            </View>
            <View style={styles.dragDropContainer}>
              <DuoDragDrop
                ref={duoDragDropRef}
                words={currentQuestion.words}
                wordHeight={40}
                lineHeight={49}
                wordGap={4}
                gesturesDisabled={false}
                rtl={false}
                wordBankOffsetY={10}
                wordBankAlignment="center"
                animatedStyleWorklet={customAnimatedStyle}
                onDrop={(ev) => {
                  const { destination, index, position } = ev;
                  console.log(destination, index, position);
                }}
                renderWord={(_word, index) => (
                  <Word
                    containerStyle={{
                      backgroundColor: "white",
                      borderColor: "lightblue",
                    }}
                    textStyle={{
                      color: "black",
                    }}
                  />
                )}
                renderPlaceholder={({ style }) => <Placeholder style={[style, { borderRadius: 5 }]} />}
                renderLines={(props) => (
                  <Lines
                    {...props}
                    containerStyle={{ backgroundColor: "transparent" }}
                    lineStyle={{ borderColor: "#CCC" }}
                  />
                )}
              />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.validateButton}
                onPress={validateAnswer}
              >
                <Text style={styles.validateButtonText}>Check Answer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ResultsDashboard />
        )}

        <Modal
          transparent
          visible={showModal}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, { color: isCorrect ? '#4CAF50' : '#f44336' }]}>
                {isCorrect ? '🎉 Correct!' : '❌ Try Again'}
              </Text>
              {isCorrect && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextQuestion}
                >
                  <Text style={styles.nextButtonText}>
                    {currentQuestionIndex === QUESTIONS.length - 1 ? 'Finish' : 'Next Question'}
                  </Text>
                </TouchableOpacity>
              )}
              {!isCorrect && (
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragDropContainer: {
    margin: 20,
    flex: 1,
  },
  debugLogText: {
    fontWeight: "500",
  },
  logContainer: {
    height: 130,
    padding: 5,
  },
  questionCard: {
    backgroundColor: 'white',
    borderColor: 'lightblue',
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '90%',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  validateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  validateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
  },
  modalText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tryAgainButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dashboardContainer: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: '600',
  },
  answerCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dashboardQuestion: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  answerSection: {
    marginBottom: 10,
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultBadge: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
