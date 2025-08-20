"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./expense.module.css"

type ExpenseReport = {
  id: number;
  expenseDate: string;
  departureLocation: string;
  arrivalLocation: string;
  transportationMethod: string;
  purpose: string;
  amount: number;
  description?: string;
  receiptAttached: boolean;
  status: string;
  createdAt: string;
}

export default function ExpenseReportPage() {
  const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseReport | null>(null)
  const [formData, setFormData] = useState({
    expenseDate: "",
    departureLocation: "",
    arrivalLocation: "",
    transportationMethod: "電車",
    purpose: "",
    amount: "",
    description: "",
    receiptAttached: false
  })
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      getUserInfo();
    }
  }, [])

  // ユーザー情報取得
  const getUserInfo = async () => {
    // ブラウザ環境でのみlocalStorageにアクセス
    if (typeof window === 'undefined') {
      return;
    }
    
    const access_token = localStorage.getItem("access_token");
    console.log("Access token:", access_token ? "存在" : "なし"); // デバッグログ
    
    if (!access_token) {
      alert("ログインが必要です。");
      router.push("/login");
      return;
    }
    try {
      console.log("Cognitoへのリクエスト開始"); // デバッグログ
      const res = await axios.post(
        "https://cognito-idp.ap-northeast-1.amazonaws.com/",
        { AccessToken: access_token }, 
        {
          headers: {
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser"
          }
        }
      );
      console.log("Cognitoからの応答:", res.data); // デバッグログ
      const data = res.data;
      if (data.Username) {
        setUserId(data.Username);
        fetchExpenseReports(data.Username);
      } else {
        alert("認証エラー");
        localStorage.removeItem("access_token");
        router.push("/login");
      }
    } catch (error) {
      console.error("API通信エラー詳細:", error);
      if (axios.isAxiosError(error)) {
        console.error("エラーレスポンス:", error.response?.data);
        console.error("エラーステータス:", error.response?.status);
        console.error("エラーメッセージ:", error.message);
        
        if (error.response?.status === 400) {
          alert("認証トークンが無効です。再ログインしてください。");
          localStorage.removeItem("access_token");
          router.push("/login");
        } else {
          alert(`API通信エラー: ${error.message}`);
        }
      } else {
        alert("予期しないエラーが発生しました");
      }
    }
  };

  // 経費申請一覧取得
  const fetchExpenseReports = async (uid?: string) => {
    try {
      const id = uid || userId;
      if (!id) return;
      const res = await axios.get(`http://localhost:8080/api/expense-reports?userId=${id}`);
      setExpenseReports(res.data || []);
    } catch {
      setExpenseReports([]);
    }
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      expenseDate: "",
      departureLocation: "",
      arrivalLocation: "",
      transportationMethod: "電車",
      purpose: "",
      amount: "",
      description: "",
      receiptAttached: false
    });
    setEditingExpense(null);
  };

  // 新規作成フォームを開く
  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // 編集フォームを開く
  const openEditForm = (expense: ExpenseReport) => {
    setFormData({
      expenseDate: expense.expenseDate,
      departureLocation: expense.departureLocation,
      arrivalLocation: expense.arrivalLocation,
      transportationMethod: expense.transportationMethod,
      purpose: expense.purpose,
      amount: expense.amount.toString(),
      description: expense.description || "",
      receiptAttached: expense.receiptAttached
    });
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  // フォームを閉じる
  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  // 経費申請を保存
  const saveExpenseReport = async () => {
    if (!userId) return;
    
    if (!formData.expenseDate || !formData.departureLocation || !formData.arrivalLocation || !formData.purpose || !formData.amount) {
      alert("必須項目を入力してください");
      return;
    }

    try {
      const expenseData = {
        userId,
        expenseDate: formData.expenseDate,
        departureLocation: formData.departureLocation,
        arrivalLocation: formData.arrivalLocation,
        transportationMethod: formData.transportationMethod,
        purpose: formData.purpose,
        amount: parseInt(formData.amount),
        description: formData.description,
        receiptAttached: formData.receiptAttached
      };

      if (editingExpense) {
        await axios.put(`http://localhost:8080/api/expense-reports/${editingExpense.id}`, expenseData);
        alert("経費申請を更新しました");
      } else {
        await axios.post(`http://localhost:8080/api/expense-reports`, expenseData);
        alert("経費申請を登録しました");
      }

      await fetchExpenseReports();
      closeForm();
    } catch (error) {
      alert("保存に失敗しました");
    }
  };

  // 経費申請を削除
  const deleteExpenseReport = async (id: number) => {
    if (!confirm("この経費申請を削除しますか？")) return;
    
    try {
      await axios.delete(`http://localhost:8080/api/expense-reports/${id}`);
      await fetchExpenseReports();
      alert("経費申請を削除しました");
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  // 金額をフォーマット
  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + "円";
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  // ステータス表示
  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "申請中";
      case "APPROVED": return "承認済み";
      case "REJECTED": return "却下";
      default: return status;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.h1}>経費申請</h1>
        <button className={styles.backButton} onClick={() => router.push("/attendance")}>
          勤怠画面に戻る
        </button>
      </div>

      <button className={styles.createButton} onClick={openCreateForm}>
        新規申請
      </button>

      {/* 経費申請一覧 */}
      <div className={styles.expenseList}>
        {expenseReports.map(expense => (
          <div key={expense.id} className={styles.expenseItem}>
            <div className={styles.expenseHeader}>
              <span className={styles.expenseDate}>{formatDate(expense.expenseDate)}</span>
              <span className={`${styles.status} ${styles[expense.status.toLowerCase()]}`}>
                {getStatusText(expense.status)}
              </span>
            </div>
            
            <div className={styles.expenseDetails}>
              <div className={styles.route}>
                {expense.departureLocation} → {expense.arrivalLocation}
              </div>
              <div className={styles.method}>交通手段: {expense.transportationMethod}</div>
              <div className={styles.purpose}>目的: {expense.purpose}</div>
              <div className={styles.amount}>{formatAmount(expense.amount)}</div>
              {expense.description && (
                <div className={styles.description}>備考: {expense.description}</div>
              )}
              {expense.receiptAttached && (
                <div className={styles.receipt}>📄 領収書あり</div>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.editButton} onClick={() => openEditForm(expense)}>
                編集
              </button>
              <button className={styles.deleteButton} onClick={() => deleteExpenseReport(expense.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 申請フォーム */}
      {isFormOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editingExpense ? "経費申請編集" : "新規経費申請"}</h3>
            
            <div className={styles.form}>
              <label>
                使用日*:
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  className={styles.input}
                />
              </label>

              <label>
                出発地*:
                <input
                  type="text"
                  value={formData.departureLocation}
                  onChange={(e) => setFormData({...formData, departureLocation: e.target.value})}
                  className={styles.input}
                  placeholder="例：東京駅"
                />
              </label>

              <label>
                到着地*:
                <input
                  type="text"
                  value={formData.arrivalLocation}
                  onChange={(e) => setFormData({...formData, arrivalLocation: e.target.value})}
                  className={styles.input}
                  placeholder="例：新宿駅"
                />
              </label>

              <label>
                交通手段*:
                <select
                  value={formData.transportationMethod}
                  onChange={(e) => setFormData({...formData, transportationMethod: e.target.value})}
                  className={styles.select}
                >
                  <option value="電車">電車</option>
                  <option value="バス">バス</option>
                  <option value="タクシー">タクシー</option>
                  <option value="自家用車">自家用車</option>
                  <option value="飛行機">飛行機</option>
                  <option value="新幹線">新幹線</option>
                </select>
              </label>

              <label>
                目的*:
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className={styles.input}
                  placeholder="例：営業訪問、会議参加"
                />
              </label>

              <label>
                金額*:
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className={styles.input}
                  placeholder="円"
                />
              </label>

              <label>
                備考:
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={styles.textarea}
                  placeholder="その他詳細があれば記載してください"
                />
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.receiptAttached}
                  onChange={(e) => setFormData({...formData, receiptAttached: e.target.checked})}
                />
                領収書添付あり
              </label>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.saveButton} onClick={saveExpenseReport}>
                {editingExpense ? "更新" : "登録"}
              </button>
              <button className={styles.cancelButton} onClick={closeForm}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className={styles.logoutButton}
        onClick={() => {
          localStorage.removeItem("access_token");
          router.push("/");
        }}
      >
        ログアウト
      </button>
    </div>
  )
}
