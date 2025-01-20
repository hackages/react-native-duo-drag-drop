/* eslint-disable react-native/no-inline-styles */
import "react-native-gesture-handler";
import { useRef, useState } from "react";
import { StyleSheet, View, Text, Button, SafeAreaView, Modal, Pressable, TouchableOpacity, Dimensions } from "react-native";
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

type Quiz = {
  id: number;
  title: string;
  questions: Question[];
};

type Chapter = {
  id: number;
  title: string;
  description: string;
  quizzes: Quiz[];
  isLocked?: boolean;
};

const COURSE_CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "Basic Computing Terms",
    description: "Learn fundamental computing terminology and common acronyms",
    quizzes: [
      {
        id: 1,
        title: "Computer Basics",
        questions: [
          {
            id: 1,
            question: "What does PC stand for?",
            words: ["Personal", "Computer", "Processing", "Central", "Computing"],
            correctAnswer: ["Personal", "Computer"],
          },
          {
            id: 2,
            question: "What does CPU stand for?",
            words: ["Central", "Computing", "Processing", "Unit", "Unified"],
            correctAnswer: ["Central", "Processing", "Unit"],
          },
        ],
      },
      {
        id: 2,
        title: "Storage Terms",
        questions: [
          {
            id: 1,
            question: "What does HDD stand for?",
            words: ["Hard", "Disk", "Drive", "Data", "Digital"],
            correctAnswer: ["Hard", "Disk", "Drive"],
          },
          {
            id: 2,
            question: "What does SSD stand for?",
            words: ["Solid", "State", "Drive", "Storage", "System"],
            correctAnswer: ["Solid", "State", "Drive"],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Internet & Web Technologies",
    description: "Master common web and internet-related terminology",
    quizzes: [
      {
        id: 1,
        title: "Web Basics",
        questions: [
          {
            id: 1,
            question: "What does HTTP stand for?",
            words: ["Hyper", "Text", "Transfer", "Protocol", "Process"],
            correctAnswer: ["Hyper", "Text", "Transfer", "Protocol"],
          },
          {
            id: 2,
            question: "What does HTML stand for?",
            words: ["Hyper", "Text", "Markup", "Language", "Link"],
            correctAnswer: ["Hyper", "Text", "Markup", "Language"],
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Software Development",
    description: "Learn common programming and development terminology",
    quizzes: [
      {
        id: 1,
        title: "Development Basics",
        questions: [
          {
            id: 1,
            question: "What does IDE stand for?",
            words: ["Integrated", "Development", "Environment", "Interface", "Engine"],
            correctAnswer: ["Integrated", "Development", "Environment"],
          },
          {
            id: 2,
            question: "What does API stand for?",
            words: ["Application", "Programming", "Interface", "Program", "Integration"],
            correctAnswer: ["Application", "Programming", "Interface"],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Networking Fundamentals",
    description: "Understand basic networking terminology and concepts",
    quizzes: [
      {
        id: 1,
        title: "Network Basics",
        questions: [
          {
            id: 1,
            question: "What does LAN stand for?",
            words: ["Local", "Area", "Network", "Link", "Access"],
            correctAnswer: ["Local", "Area", "Network"],
          },
          {
            id: 2,
            question: "What does DNS stand for?",
            words: ["Domain", "Name", "System", "Server", "Service"],
            correctAnswer: ["Domain", "Name", "System"],
          },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Modern Tech Trends",
    description: "Explore contemporary technology terms and concepts",
    quizzes: [
      {
        id: 1,
        title: "Modern Technologies",
        questions: [
          {
            id: 1,
            question: "What does AI stand for?",
            words: ["Artificial", "Intelligence", "Interface", "Automated", "Integration"],
            correctAnswer: ["Artificial", "Intelligence"],
          },
          {
            id: 2,
            question: "What does IoT stand for?",
            words: ["Internet", "of", "Things", "Technology", "Information"],
            correctAnswer: ["Internet", "of", "Things"],
          },
        ],
      },
    ],
  },
];

const getNextQuiz = (currentQuizId: number, currentChapterId: number): Quiz | null => {
  const currentChapter = COURSE_CHAPTERS.find(chapter => chapter.id === currentChapterId);
  const nextQuizInChapter = currentChapter?.quizzes.find(quiz => quiz.id > currentQuizId);
  
  if (nextQuizInChapter) {
    return nextQuizInChapter;
  }
  
  const nextChapter = COURSE_CHAPTERS.find(chapter => chapter.id === currentChapterId + 1);
  return nextChapter?.quizzes[0] || null;
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const progress = (current / total) * 100;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#4CAF50' : '#007AFF',
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        Question {current + 1} of {total}
      </Text>
    </View>
  );
};

const CourseTimeline = ({ onSelectQuiz }: { onSelectQuiz: (quiz: Quiz) => void }) => {
  return (
    <ScrollView style={styles.timelineContainer}>
      {COURSE_CHAPTERS.map((chapter, index) => (
        <View key={chapter.id} style={styles.chapterContainer}>
          <View style={styles.timelineConnector}>
            <View style={styles.timelineDot} />
            {index !== COURSE_CHAPTERS.length - 1 && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.chapterContent}>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            <Text style={styles.chapterDescription}>{chapter.description}</Text>
            <View style={styles.quizList}>
              {chapter.quizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizButton}
                  onPress={() => onSelectQuiz(quiz)}
                >
                  <Text style={styles.quizButtonText}>{quiz.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default function App() {
  const duoDragDropRef = useRef<DuoDragDropRef>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const currentQuestion = selectedQuiz?.questions[currentQuestionIndex];

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
    if (currentQuestionIndex < selectedQuiz?.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const ResultsDashboard = () => {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const nextQuiz = selectedQuiz && getNextQuiz(selectedQuiz.id, COURSE_CHAPTERS.find(
      chapter => chapter.quizzes.some(quiz => quiz.id === selectedQuiz.id)
    )?.id || 0);
    
    return (
      <ScrollView style={styles.dashboardContainer}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Quiz Complete! 🎉</Text>
          <Text style={styles.scoreText}>
            Score: {correctAnswers}/{selectedQuiz?.questions.length}
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
        
        <View style={styles.buttonsContainer}>
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

          {nextQuiz && (
            <TouchableOpacity 
              style={styles.nextChapterButton}
              onPress={() => {
                setSelectedQuiz(nextQuiz);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setIsComplete(false);
              }}
            >
              <Text style={styles.nextChapterButtonText}>
                Next Quiz: {nextQuiz.title}
              </Text>
              <Text style={styles.nextChapterSubtext}>
                {COURSE_CHAPTERS.find(
                  chapter => chapter.quizzes.some(quiz => quiz.id === nextQuiz.id)
                )?.title}
              </Text>
            </TouchableOpacity>
          )}

          {!nextQuiz && (
            <TouchableOpacity 
              style={styles.finishButton}
              onPress={() => {
                setSelectedQuiz(null);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setIsComplete(false);
              }}
            >
              <Text style={styles.finishButtonText}>Return to Chapters</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {!selectedQuiz ? (
          <CourseTimeline onSelectQuiz={setSelectedQuiz} />
        ) : !isComplete ? (
          <ScrollView>
            <ProgressBar 
              current={currentQuestionIndex} 
              total={selectedQuiz?.questions.length} 
            />
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
                    {currentQuestionIndex === selectedQuiz?.questions.length - 1 ? 'Finish' : 'Next Question'}
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
  progressContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    width: '0%',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  timelineContainer: {
    flex: 1,
    padding: 20,
  },
  chapterContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timelineConnector: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    marginRight: 10,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#007AFF',
    marginVertical: 5,
  },
  chapterContent: {
    flex: 1,
    marginLeft: 10,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  chapterDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  quizList: {
    gap: 10,
  },
  quizButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quizButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 10,
    marginVertical: 20,
  },
  nextChapterButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextChapterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextChapterSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  finishButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
