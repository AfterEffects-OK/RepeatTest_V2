import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Firebaseのインポートは初期認証のために残します
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// Firebase設定のグローバル変数（Canvas環境から提供）
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? initialAuthToken : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// 紙吹雪アニメーションのヘルパー関数
// Reactコンポーネント外で定義し、パフォーマンスを向上
const triggerConfetti = () => {
  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#FFD700', '#ADFF2F', '#8A2BE2'];
  const numConfettiPerBurst = 20; // 1回の発生で舞う紙吹雪の数
  for (let i = 0; i < numConfettiPerBurst; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = `${Math.random() * 8 + 5}px`; // サイズをランダムに
    confetti.style.height = `${Math.random() * 8 + 5}px`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = `${-Math.random() * 30}vh`; // 画面上部から少し上に分散して開始
    confetti.style.opacity = '1';
    confetti.style.borderRadius = `${Math.random() > 0.5 ? '50%' : '0'}`; // 円形か四角形かランダムに
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`; // 初期回転

    // 個々の紙吹雪の継続時間 (3-5秒)
    const animationDuration = Math.random() * 2 + 3; // 3-5秒
    const animationDelay = Math.random() * 0.5; // 発生ごとの遅延を短くして連続感を出す

    confetti.style.transition = `transform ${animationDuration}s linear, top ${animationDuration}s linear, opacity ${animationDuration * 0.7}s ${animationDelay}s ease-out`;
    document.body.appendChild(confetti);

    // アニメーションをトリガー
    setTimeout(() => {
      confetti.style.top = `${100 + Math.random() * 20}vh`; // 画面下部よりさらに下へ
      confetti.style.opacity = '0';
      confetti.style.transform = `rotate(${Math.random() * 720 + 360}deg)`; // 落下中にさらに回転
    }, 50); // 初期スタイル適用後のわずかな遅延

    // アニメーション終了後に要素を削除
    setTimeout(() => {
      confetti.remove();
    }, (animationDuration * 1000) + (animationDelay * 1000) + 100);
  }
};

// 紙吹雪を連続的に発生させる関数
const startContinuousConfetti = (durationInSeconds = 10, intervalMs = 100) => {
  let elapsed = 0;
  const intervalId = setInterval(() => {
    triggerConfetti();
    elapsed += intervalMs;
    if (elapsed >= durationInSeconds * 1000) {
      clearInterval(intervalId);
    }
  }, intervalMs);
};


// メインアプリケーションコンポーネント
const App = () => {
  // Firebaseの状態管理 (認証のためのみ)
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  // モックデータ: スプレッドシートのカラムに基づいて問題を定義
  const allMockQuestions = [
    {
      id問題: 'Q001',
      id学科: 'S01',
      id学年: 'G01',
      学科: '数学',
      学年: '高校1年',
      科目: '代数',
      問題本文: '次の二次方程式を解きなさい。$x^2 - 5x + 6 = 0$',
      問題付随文: 'ヒント：因数分解を試みてください。',
      画像URL: 'https://placehold.co/400x200/A0A0A0/FFFFFF?text=問題画像1',
      動画URL: '',
      選択肢A: '$x = 2, 3$',
      選択肢B: '$x = 1, 6$',
      選択肢C: '$x = -2, -3$',
      選択肢D: '$x = 0, 5$',
      選択肢E: '',
      選択肢F: '',
      選択肢G: '',
      選択肢H: '',
      選択肢I: '',
      選択肢J: '',
      正解: '$x = 2, 3$',
      作成日時: '2023-01-01T10:00:00Z',
      更新日時: '2023-01-01T10:00:00Z',
      作成者Email: 'admin@example.com',
      編集者Email: 'admin@example.com',
      フラグ: false,
      メモ: '簡単な二次方程式',
    },
    {
      id問題: 'Q002',
      id学科: 'S01',
      id学年: 'G01',
      学科: '数学',
      学年: '高校1年',
      科目: '幾何',
      問題本文: '三角形の内角の和は何度ですか？',
      問題付随文: '基本的な幾何学の知識を思い出してください。',
      画像URL: 'https://placehold.co/400x200/A0A0A0/FFFFFF?text=問題画像2',
      動画URL: '',
      選択肢A: '90度',
      選択肢B: '180度',
      選択肢C: '270度',
      選択肢D: '360度',
      選択肢E: '',
      選択肢F: '',
      選択肢G: '',
      選択肢H: '',
      選択肢I: '',
      選択肢J: '',
      正解: '180度',
      作成日時: '2023-01-02T11:00:00Z',
      更新日時: '2023-01-02T11:00:00Z',
      作成者Email: 'admin@example.com',
      編集者Email: 'admin@example.com',
      フラグ: false,
      メモ: '幾何学基礎',
    },
    {
      id問題: 'Q003',
      id学科: 'S02',
      id学年: 'G02',
      学科: '国語',
      学年: '高校2年',
      科目: '現代文',
      問題本文: '次の文の「主語」を答えなさい。\n\n「私は昨日、友達と一緒に映画を見に行った。」',
      問題付随文: '日本語の文法構造を思い出してください。',
      画像URL: 'https://placehold.co/400x200/808080/FFFFFF?text=問題画像3',
      動画URL: '',
      選択肢A: '私',
      選択肢B: '昨日',
      選択肢C: '友達と',
      選択肢D: '映画を',
      選択肢E: '',
      選択肢F: '',
      選択肢G: '',
      選択肢H: '',
      選択肢I: '',
      選択肢J: '',
      正解: '私',
      作成日時: '2023-01-05T14:30:00Z',
      更新日時: '2023-01-05T14:30:00Z',
      作成者Email: 'admin@example.com',
      編集者Email: 'admin@example.com',
      フラグ: false,
      メモ: '文法問題',
    },
    {
      id問題: 'Q004',
      id学科: 'S02',
      id学年: 'G02',
      科目: '古典',
      問題本文: '「徒然草」の作者は誰ですか？',
      問題付随文: '鎌倉時代の随筆です。',
      画像URL: 'https://placehold.co/400x200/808080/FFFFFF?text=問題画像4',
      動画URL: '',
      選択肢A: '紫式部',
      選択肢B: '清少納言',
      選択肢C: '兼好法師',
      選択肢D: '鴨長明',
      選択肢E: '',
      選択肢F: '',
      選択肢G: '',
      選択肢H: '',
      選択肢I: '',
      選択肢J: '',
      正解: '兼好法師',
      作成日時: '2023-01-06T15:00:00Z',
      更新日時: '2023-01-06T15:00:00Z',
      作成者Email: 'admin@example.com',
      編集者Email: 'admin@example.com',
      フラグ: false,
      メモ: '古典文学',
    },
    {
      id問題: 'Q005',
      id学科: 'S03',
      id学年: 'G03',
      学科: '歴史',
      学年: '高校3年',
      科目: '日本史',
      問題本文: '西暦1600年に日本で行われた天下分け目の戦いは何ですか？',
      問題付随文: 'この戦いの後、徳川家康が覇権を握りました。',
      画像URL: 'https://placehold.co/400x200/606060/FFFFFF?text=問題画像5',
      動画URL: '',
      選択肢A: '桶狭間の戦い',
      選択肢B: '川中島の戦い',
      選択肢C: '関ヶ原の戦い',
      選択肢D: '長篠の戦い',
      選択肢E: '本能寺の変',
      選択肢F: '',
      選択肢G: '',
      選択肢H: '',
      選択肢I: '',
      選択肢J: '',
      正解: '関ヶ原の戦い',
      作成日時: '2023-01-10T09:00:00Z',
      更新日時: '2023-01-10T09:00:00Z',
      作成者Email: 'admin@example.com',
      編集者Email: 'admin@example.com',
      フラグ: false,
      メモ: '日本の戦国時代',
    },
    {
      id問題: 'Q006',
      id学科: 'S03',
      id学年: 'G03',
      学科: '歴史',
      科目: '世界史',
      問題本文: 'フランス革命は西暦何年に勃発しましたか？',
      問題付随文: 'バスティーユ牢獄襲撃がきっかけです。',
      画像URL: 'https://placehold.co/400x200/606060/FFFFFF?text=問題画像6',
      動画URL: '',
      選択肢A: '1776年',
      選択肢B: '1789年',
      選択肢C: '1815年',
      選択肢D: '1848年',
      選択肢E: '',
      選択肢F: '',
      選択肢G: '',
      選択肢H: '',
      選択肢I: '',
      選択肢J: '',
      正解: '1789年',
      作成日時: '2023-01-11T10:00:00Z',
      更新日時: '2023-01-11T10:00:00Z',
      作成者Email: 'admin@example.com',
      編集者Email: 'admin@example.com',
      フラグ: false,
      メモ: 'フランス革命',
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false); // このモーダルはSummaryScreenに置き換えられるため、ほぼ使用されません
  const [quizStarted, setQuizStarted] = useState(false); // クイズが開始されたかどうか
  const [userName, setUserName] = useState(''); // 氏名入力用ステート

  // クイズ結果のステート
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [showSummary, setShowSummary] = useState(false); // サマリー画面表示用ステート
  const [incorrectlyAnsweredQuestions, setIncorrectlyAnsweredQuestions] = useState([]); // 間違えた問題とその詳細

  const [selected学科, setSelected学科] = useState('全て');
  const [selected学年, setSelected学年] = useState('全て');
  const [selected科目, setSelected科目] = useState('全て');

  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true); // 初期値をtrueに変更

  // Firebaseの初期化と認証
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(authInstance, initialAuthToken);
            } else {
              const anonymousUser = await signInAnonymously(authInstance);
              setUserId(anonymousUser.user.uid);
            }
          } catch (error) {
            console.error("Firebase authentication failed:", error);
            setUserId(crypto.randomUUID());
          }
        }
        setIsAuthReady(true);
        setFirebaseLoading(false);
        setLoadingQuestions(false); // Firebase認証完了後にローディングを終了
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      setFirebaseLoading(false);
      setIsAuthReady(true);
      setUserId(crypto.randomUUID());
      setLoadingQuestions(false); // エラー時もローディングを終了
    }
  }, []);

  const GAS_WEB_APP_URL = 'YOUR_DEPLOYED_GAS_WEB_APP_URL_HERE'; // ★ここを実際のURLに更新してください★

  const saveProgressToSpreadsheet = async (data) => {
    if (GAS_WEB_APP_URL === 'YOUR_DEPLOYED_GAS_WEB_APP_URL_HERE') {
      console.warn("GASウェブアプリURLが設定されていません。GASをデプロイし、コードを更新してください。");
      console.log("--- スプレッドシートに記録されるはずのデータ ---");
      console.log("UserID:", data.userId);
      console.log("氏名:", data.userName); // 氏名を追加
      console.log("Question ID:", data.questionId);
      console.log("学科:", data.学科);
      console.log("学年:", data.学年);
      console.log("科目:", data.科目);
      console.log("Selected Answer:", data.selectedAnswer);
      console.log("Correct Answer:", data.correctAnswer);
      console.log("Is Correct:", data.isCorrect);
      console.log("Timestamp:", new Date(data.timestamp).toLocaleString());
      console.log("------------------------------------------");
      return;
    }

    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 'success') {
        console.log('解答進捗がGoogleスプレッドシートに記録されました:', result.message);
      } else {
        console.error('解答進捗のGoogleスプレッドシートへの記録に失敗しました:', result.message);
      }
    } catch (error) {
      console.error('Google Apps Scriptへのデータ送信中にエラーが発生しました:', error);
    }
  };

  // フィルタリングされた問題リストを計算 (useMemoで最適化)
  const filteredQuestions = useMemo(() => {
    return allMockQuestions.filter(question => {
      const matches学科 = selected学科 === '全て' || question.学科 === selected学科;
      const matches学年 = selected学年 === '全て' || question.学年 === selected学年;
      const matches科目 = selected科目 === '全て' || question.科目 === selected科目;
      return matches学科 && matches学年 && matches科目;
    });
  }, [allMockQuestions, selected学科, selected学年, selected科目]);

  // 新しい問題セットを準備し、状態をリセットする関数
  // この関数は、クイズ開始時またはセット完了時にのみ呼び出される
  const prepareAndShuffleQuestions = useCallback(() => {
    setLoadingQuestions(true); // 問題セット準備開始
    setCurrentQuestionIndex(0); // インデックスをリセット
    setSelectedAnswer(null); // 解答をリセット
    setIsCorrect(null); // 正誤をリセット
    setShowFeedback(false); // フィードバックを非表示
    setShowCompletionModal(false); // 完了モーダルを閉じる
    setCorrectCount(0); // 正解数をリセット
    setTotalQuestionsAnswered(0); // 解答数をリセット
    setShowSummary(false); // サマリーを非表示
    setIncorrectlyAnsweredQuestions([]); // 間違えた問題リストをリセット

    // 小さな遅延を追加して、ユーザーが「準備中」メッセージを認識できるようにする
    const timer = setTimeout(() => {
      if (filteredQuestions.length > 0) {
        const mainShuffledQuestions = [...filteredQuestions].sort(() => 0.5 - Math.random());

        // 各問題について、選択肢と正解をまとめてシャッフルする
        const questionsWithShuffledOptions = mainShuffledQuestions.map(q => {
          const otherOptions = [
            q.選択肢A, q.選択肢B, q.選択肢C, q.選択肢D, q.選択肢E,
            q.選択肢F, q.選択肢G, q.選択肢H, q.選択肢I, q.選択肢J,
          ].filter(option => option !== '' && option !== q.正解); // 正解以外の有効な選択肢

          // 正解と他の選択肢を結合し、シャッフル
          const allDisplayOptions = [...otherOptions, q.正解];
          const shuffledDisplayOptions = [...allDisplayOptions].sort(() => 0.5 - Math.random());

          return {
            ...q,
            shuffledDisplayOptions: shuffledDisplayOptions, // シャッフルされた表示用選択肢
          };
        });
        // シャッフルされた問題リストから最初の5問だけを選択
        setShuffledQuestions(questionsWithShuffledOptions.slice(0, 5));
      } else {
        setShuffledQuestions([]);
      }
      setLoadingQuestions(false); // 問題セット準備完了
      setQuizStarted(true); // クイズを開始
    }, 300); // 300ミリ秒の遅延

    return () => clearTimeout(timer);
  }, [filteredQuestions]); // filteredQuestionsが変わったときのみこの関数を再生成

  // フィルタリング条件が変わったら、クイズ状態をリセット
  useEffect(() => {
    setQuizStarted(false); // フィルタが変わったらクイズを停止
    setShuffledQuestions([]); // シャッフルされた問題をクリア
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
    setShowCompletionModal(false);
    setCorrectCount(0); // フィルター変更時も正解数をリセット
    setTotalQuestionsAnswered(0); // フィルター変更時も解答数をリセット
    setShowSummary(false); // フィルター変更時もサマリーを非表示
    setIncorrectlyAnsweredQuestions([]); // 間違えた問題リストをリセット
  }, [selected学科, selected学年, selected科目]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  // 表示用の選択肢はcurrentQuestion.shuffledDisplayOptionsから取得
  const displayOptions = currentQuestion ? currentQuestion.shuffledDisplayOptions : [];

  const unique学科s = useMemo(() => ['全て', ...new Set(allMockQuestions.map(q => q.学科))].sort(), [allMockQuestions]);
  const unique学年s = useMemo(() => ['全て', ...new Set(allMockQuestions.map(q => q.学年))].sort(), [allMockQuestions]);
  const unique科目s = useMemo(() => ['全て', ...new Set(allMockQuestions.map(q => q.科目))].sort(), [allMockQuestions]);

  const handleAnswerSelect = async (option) => {
    setSelectedAnswer(option);
    // 正誤判定は元の正解フィールドと照合
    const correct = (option === currentQuestion.正解);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setCorrectCount(prevCount => prevCount + 1);
    } else {
      // 間違えた問題をリストに追加
      setIncorrectlyAnsweredQuestions(prevList => [
        ...prevList,
        {
          id: currentQuestion.id問題, // 問題IDをキーとして使用できるように追加
          questionText: currentQuestion.問題本文,
          yourAnswer: option,
          correctAnswer: currentQuestion.正解,
        }
      ]);
    }

    if (isAuthReady && userId) {
      const progressData = {
        userId: userId,
        userName: userName, // 氏名を追加
        questionId: currentQuestion.id問題,
        学科: currentQuestion.学科,
        学年: currentQuestion.学年,
        科目: currentQuestion.科目,
        selectedAnswer: option,
        correctAnswer: currentQuestion.正解,
        isCorrect: correct,
        timestamp: Date.now(),
      };
      await saveProgressToSpreadsheet(progressData);
    } else {
      console.warn("ユーザーIDが準備できていないため、スプレッドシートへの保存をスキップしました。");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowFeedback(false);
    } else {
      // 全ての問題が終了した場合
      setTotalQuestionsAnswered(shuffledQuestions.length); // 解答数を確定
      setShowSummary(true); // サマリー画面を表示
      setQuizStarted(false); // クイズを停止
      // モーダルは表示しない
    }
  };

  // サマリー画面から再挑戦するハンドラー
  const handleRestartQuizFromSummary = () => {
    // 全てのクイズ関連ステートを初期値に戻す
    setQuizStarted(false);
    // setUserName(''); // 氏名をリセットする行をコメントアウトまたは削除
    setShuffledQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
    setShowCompletionModal(false);
    setCorrectCount(0);
    setTotalQuestionsAnswered(0);
    setShowSummary(false); // サマリー画面を非表示
    setIncorrectlyAnsweredQuestions([]); // 間違えた問題リストをリセット
    // フィルター選択画面に戻る
  };

  // 「クイズを開始」ボタンが押されたときのハンドラー
  const handleStartQuiz = () => {
    if (filteredQuestions.length === 0) {
      // 問題がない場合は何もしないか、ユーザーに通知
      console.warn("選択された条件に合致する問題がありません。");
      return;
    }
    prepareAndShuffleQuestions(); // 新しい問題セットを準備し、クイズを開始
  };

  if (firebaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
        <p className="text-xl text-gray-700">読み込み中...</p>
      </div>
    );
  }

  // サマリー画面コンポーネント
  const SummaryScreen = ({ correct, total, onRestart, incorrectQuestions, userName }) => {
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    let comment = '';
    let commentColor = '';

    // 正答率に応じたコメントの配列
    const comments100 = [
      '全問正解！素晴らしい！おめでとうございます！🎉',
      '完璧です！この調子で次の課題もクリアしましょう！💯',
      '見事全問正解！あなたの努力が実を結びましたね！✨',
    ];
    const comments70 = [
      'よくできました！この調子で頑張りましょう！👍',
      'あと一歩で全問正解ですね！素晴らしいです！😊',
      'かなりの実力です！もう少しで完璧になりますよ！🌟',
    ];
    const comments40 = [
      'もう少し練習が必要です。諦めずに頑張りましょう！💪',
      '着実に力がついています！苦手な部分を克服していきましょう！💡',
      'よく頑張りました！復習が大切ですよ！📖',
    ];
    const commentsUnder40 = [
      '頑張りましょう！基本から見直してみるのも良いでしょう。💡',
      '大丈夫、ここから伸びしろしかありません！一緒に頑張りましょう！🚀',
      '焦らず、一つずつ丁寧に理解を深めていきましょう！🌱',
    ];

    // ランダムにコメントを選択し、氏名を挿入
    let namePrefix = userName ? `${userName}さん、` : '';
    if (accuracy === 100) {
      comment = namePrefix + comments100[Math.floor(Math.random() * comments100.length)];
      commentColor = 'text-green-700';
    } else if (accuracy >= 70) {
      comment = namePrefix + comments70[Math.floor(Math.random() * comments70.length)];
      commentColor = 'text-blue-700';
    } else if (accuracy >= 40) {
      comment = namePrefix + comments40[Math.floor(Math.random() * comments40.length)];
      commentColor = 'text-yellow-700';
    } else {
      comment = namePrefix + commentsUnder40[Math.floor(Math.random() * commentsUnder40.length)];
      commentColor = 'text-red-700';
    }

    useEffect(() => {
      if (accuracy === 100) {
        startContinuousConfetti(10, 100); // 紙吹雪を10秒間、100msごとに発生させる
      }
    }, [accuracy]);

    return (
      // サマリー画面のメインコンテナでスクロールを処理
      // max-h-[90vh]を追加し、overflow-y-autoを設定
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-auto text-center flex flex-col transform transition-all duration-300 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">クイズ結果</h2>
        {/* 解答者表示を削除しました */}
        <p className="text-2xl font-semibold text-gray-700 mb-4">
          正解数: <span className="text-blue-600">{correct}</span> / {total} 問
        </p>
        <p className="text-3xl font-bold mb-6">
          正答率: <span className={`${commentColor} text-4xl`}>{accuracy}%</span>
        </p>
        <p className={`text-xl font-bold ${commentColor} mb-8`}>
          {comment}
        </p>

        {incorrectQuestions.length > 0 && (
          // 間違えた問題リストの表示領域から個別のスクロール制限を削除
          <div className="mt-8 pt-6 border-t border-gray-200 text-left">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">間違えた問題</h3>
            <div className="space-y-6">
              {incorrectQuestions.map((item) => (
                <div key={item.id} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-2">
                    <span className="text-red-700">問題:</span> {item.questionText}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold text-gray-700">あなたの解答:</span> <span className="font-bold text-red-800 text-sm">{item.yourAnswer}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">正解:</span> <span className="font-bold text-green-600 text-base">{item.correctAnswer}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onRestart}
          className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-75"
        >
          再挑戦
        </button>
      </div>
    );
  };

  return (
    // App のメインコンテナは `justify-center` のままに保ち、
    // 子要素である `SummaryScreen` が自身の高さでスクロールを管理する
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col items-center justify-center p-4 font-inter relative">
      {userId && (
        <div className="absolute top-4 right-4 bg-gray-800 text-white text-sm px-3 py-1 rounded-full shadow-md">
          UserID: {userId}
        </div>
      )}

      {showSummary ? (
        <SummaryScreen
          correct={correctCount}
          total={totalQuestionsAnswered}
          onRestart={handleRestartQuizFromSummary}
          incorrectQuestions={incorrectlyAnsweredQuestions}
          userName={userName}
        />
      ) : (
        // クイズ画面のコンテナ。全体にスクロールバーが出ないようにoverflow-autoは削除
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full mx-auto transform transition-all duration-300 hover:scale-105">
          {/* タイトル部分に画像を追加 */}
          <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 tracking-tight flex items-center justify-center">
            <img
              src="https://placehold.co/80x80/6A5ACD/FFFFFF?text=Q" // 例のロゴ画像
              alt="問題解答サイトロゴ"
              className="h-16 w-16 mr-4 rounded-full shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/400x200/C0C0C0/555555?text=画像なし";
              }}
            />
            問題解答サイト
          </h1>

          {/* フィルタリングUI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col">
              <label htmlFor="学科-select" className="text-sm font-medium text-gray-700 mb-1">学科:</label>
              <select
                id="学科-select"
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selected学科}
                onChange={(e) => setSelected学科(e.target.value)}
                disabled={loadingQuestions || quizStarted} // 問題準備中またはクイズ中は無効
              >
                {unique学科s.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="学年-select" className="text-sm font-medium text-gray-700 mb-1">学年:</label>
              <select
                id="学年-select"
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selected学年}
                onChange={(e) => setSelected学年(e.target.value)}
                disabled={loadingQuestions || quizStarted} // 問題準備中またはクイズ中は無効
              >
                {unique学年s.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="科目-select" className="text-sm font-medium text-gray-700 mb-1">科目:</label>
              <select
                id="科目-select"
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selected科目}
                onChange={(e) => setSelected科目(e.target.value)}
                disabled={loadingQuestions || quizStarted} // 問題準備中またはクイズ中は無効
              >
                {unique科目s.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>
          </div>

          {/* フィルタリングされた問題がない場合の表示 */}
          {filteredQuestions.length === 0 && !loadingQuestions && (
            <p className="text-center text-red-500 text-lg my-8">
              選択されたフィルター条件に合致する問題がありません。
            </p>
          )}

          {/* 問題の準備中または「クイズを開始」ボタン */}
          {loadingQuestions ? (
            <div className="text-center text-gray-600 text-xl my-8">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              問題準備中...
            </div>
          ) : (
            !quizStarted && filteredQuestions.length > 0 ? ( // クイズが開始されておらず、問題がある場合
              <div className="text-center mt-8">
                <div className="mb-4">
                  <label htmlFor="userName" className="block text-gray-700 text-lg font-bold mb-2">氏名を入力してください (任意):</label>
                  <input
                    type="text"
                    id="userName"
                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="例: 山田太郎"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleStartQuiz}
                  className={`
                    bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-75
                  `}
                >
                  クイズを開始
                </button>
              </div>
            ) : null
          )}

          {/* クイズが開始され、かつ問題がある場合に問題表示 */}
          {quizStarted && currentQuestion && shuffledQuestions.length > 0 ? (
            <div className="space-y-6">
              <div className="text-center text-gray-600 font-semibold mb-4">
                問題 {currentQuestionIndex + 1} / {shuffledQuestions.length}
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 shadow-md">
                <p className="text-sm text-blue-700 font-semibold mb-2">
                  学科: {currentQuestion.学科} / 学年: {currentQuestion.学年} / 科目: {currentQuestion.科目}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mb-4 whitespace-pre-wrap">
                  {currentQuestion.問題本文}
                </h2>
                {currentQuestion.問題付随文 && (
                  <p className="text-gray-700 italic text-sm mb-4">
                    {currentQuestion.問題付随文}
                  </p>
                )}

                {currentQuestion.画像URL && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={currentQuestion.画像URL}
                      alt="問題付随画像"
                      className="rounded-md shadow-sm max-w-full h-auto"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/400x200/C0C0C0/555555?text=画像なし";
                      }}
                    />
                  </div>
                )}
                {currentQuestion.動画URL && (
                  <div className="mb-4 flex justify-center">
                    <p className="text-gray-500">動画URL: {currentQuestion.動画URL} (未実装)</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayOptions.map((option, index) => ( // index を再度受け取る
                  <button
                    key={option} // ここを修正しました
                    onClick={() => handleAnswerSelect(option)}
                    className={`
                      w-full py-3 px-5 rounded-lg border-2
                      text-left font-medium text-lg
                      transition-all duration-200 ease-in-out
                      ${selectedAnswer === option
                        ? (isCorrect === true ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600') + ' shadow-lg transform scale-105'
                        : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                      }
                      focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-75
                    `}
                    disabled={showFeedback}
                  >
                    {String.fromCharCode(65 + index)}. {option} {/* アルファベットを再追加 */}
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className="mt-6 text-center">
                  <p className="text-lg text-gray-700 mb-2">
                    あなたの選択: <span className="font-semibold text-blue-700">{selectedAnswer}</span>
                  </p>
                  {isCorrect !== null && (
                    <p className={`text-xl font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'} mb-4`}>
                      {isCorrect ? '正解！' : '不正解...'}
                    </p>
                  )}
                  <button
                    onClick={handleNextQuestion}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-75"
                  >
                    次の問題へ →
                  </button>
                </div>
              )}
            </div>
          ) : null
          }
        </div>
      )}
    </div>
  );
};

export default App;
