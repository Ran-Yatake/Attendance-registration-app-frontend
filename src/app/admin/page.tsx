"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

type ExpenseReport = {
  id: number;
  userId: string;
  expenseDate: string;
  departureLocation: string;
  arrivalLocation: string;
  transportationMethod: string;
  purpose: string;
  amount: number;
  description: string;
  receiptAttached: boolean;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseReport[]>([]);
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドのみ
    if (typeof window !== "undefined") {
      const access_token = localStorage.getItem("access_token");
      if (!access_token) {
        router.push("/login");
        return;
      }
      
      // まずCognitoでuserIdを取得
      fetch("https://cognito-idp.ap-northeast-1.amazonaws.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser"
        },
        body: JSON.stringify({ AccessToken: access_token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.Username) {
            // userIdでプロフィール取得
            return fetch(`http://localhost:8080/api/user-profile/me?userId=${data.Username}`);
          } else {
            throw new Error("認証エラー");
          }
        })
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          if (data && data.admin === true) {
            setIsAdmin(true);
            // 管理者の場合、申請中の経費申請を取得
            fetchPendingExpenses();
          } else {
            setIsAdmin(false);
          }
        })
        .catch(() => {
          setIsAdmin(false);
        });
    }
  }, [router]);

  // 申請中の経費申請を取得
  const fetchPendingExpenses = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/expense-reports/admin/pending');
      const data = await response.json();
      setPendingExpenses(data);
    } catch (error) {
      console.error('経費申請取得エラー:', error);
    }
  };

  // 経費申請承認
  const approveExpense = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/expense-reports/admin/approve/${id}`, {
        method: 'PUT'
      });
      // 承認後、一覧を再取得
      fetchPendingExpenses();
    } catch (error) {
      console.error('承認エラー:', error);
    }
  };

  // 経費申請却下
  const rejectExpense = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/expense-reports/admin/reject/${id}`, {
        method: 'PUT'
      });
      // 却下後、一覧を再取得
      fetchPendingExpenses();
    } catch (error) {
      console.error('却下エラー:', error);
    }
  };

  if (isAdmin === null) {
    return <div className={styles.loading}>認証中...</div>;
  }
  if (isAdmin === false) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>権限がありません</h1>
        <div className={styles.error}>
          このページは管理者のみアクセスできます。
        </div>
        <button 
          className={styles.backButton}
          onClick={() => router.push("/attendance")}
        >
          勤怠ページに戻る
        </button>
      </main>
    );
  }
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>管理者ページ</h1>
        <button 
          className={styles.backButton}
          onClick={() => router.push("/attendance")}
        >
          勤怠ページに戻る
        </button>
      </header>
      
      <section>
        <h2 style={{fontSize: "1.5rem", fontWeight: 600, marginBottom: 20, color: "#2563eb"}}>
          経費申請承認 ({pendingExpenses.length}件)
        </h2>
        
        {pendingExpenses.length === 0 ? (
          <div className={styles.noExpenses}>
            承認待ちの経費申請はありません
          </div>
        ) : (
          <div className={styles.expenseGrid}>
            {pendingExpenses.map(expense => (
              <div key={expense.id} className={styles.expenseCard}>
                <div className={styles.expenseHeader}>
                  <div className={styles.expenseDate}>
                    {new Date(expense.expenseDate).toLocaleDateString('ja-JP')}
                  </div>
                  <span className={styles.status}>承認待ち</span>
                </div>
                
                <div className={styles.expenseDetails}>
                  <div className={styles.route}>
                    {expense.departureLocation} → {expense.arrivalLocation}
                  </div>
                  <div className={styles.userId}>
                    申請者: {expense.userId}
                  </div>
                  <div className={styles.method}>
                    交通手段: {expense.transportationMethod}
                  </div>
                  <div className={styles.amount}>
                    ¥{expense.amount.toLocaleString()}
                  </div>
                  <div className={styles.purpose}>
                    目的: {expense.purpose}
                  </div>
                  {expense.description && (
                    <div className={styles.description}>
                      備考: {expense.description}
                    </div>
                  )}
                  {expense.receiptAttached && (
                    <div className={styles.receipt}>
                      📎 領収書添付済み
                    </div>
                  )}
                </div>
                
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => rejectExpense(expense.id)}
                    className={styles.rejectButton}
                  >
                    却下
                  </button>
                  <button
                    onClick={() => approveExpense(expense.id)}
                    className={styles.approveButton}
                  >
                    承認
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
