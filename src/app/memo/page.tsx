"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./memo.module.css"

type Attendance = { 
  id: number; 
  workDate: string; 
  startTime: string; 
  breakStartTime?: string; 
  breakEndTime?: string; 
  endTime?: string; 
  status: string; 
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const router = useRouter();

  useEffect(() => {
    getUserInfo();
  }, [])

  // ユーザー情報取得
  const getUserInfo = async () => {
    const access_token = localStorage.getItem("access_token");
    if (!access_token) {
      alert("ログインが必要です。");
      router.push("/");
      return;
    }
    try {
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
      const data = res.data;
      if (data.Username) {
        setUserId(data.Username);
        fetchAttendances(data.Username);
        fetchTodayAttendance(data.Username);
      } else {
        alert("認証エラー");
        localStorage.removeItem("access_token");
        router.push("/");
      }
    } catch (error) {
      alert("API通信エラー");
      console.error(error);
    }
  };

  // 勤怠記録一覧取得
  const fetchAttendances = async (uid?: string) => {
    try {
      const id = uid || userId;
      if (!id) return;
      const res = await axios.get(`http://localhost:8080/api/attendance?userId=${id}`);
      setAttendances(res.data || []);
    } catch {
      setAttendances([]);
    }
  };

  // 今日の勤怠記録取得
  const fetchTodayAttendance = async (uid?: string) => {
    try {
      const id = uid || userId;
      if (!id) return;
      const res = await axios.get(`http://localhost:8080/api/attendance/today?userId=${id}`);
      setTodayAttendance(res.data);
    } catch {
      setTodayAttendance(null);
    }
  };

  // 出勤打刻
  const startWork = async () => {
    if (!userId) return;
    try {
      await axios.post(`http://localhost:8080/api/attendance/start?userId=${userId}`);
      await fetchTodayAttendance();
      await fetchAttendances();
      alert("出勤打刻が完了しました");
    } catch (error) {
      alert("出勤打刻に失敗しました");
    }
  };

  // 休憩開始打刻
  const startBreak = async () => {
    if (!userId) return;
    try {
      await axios.put(`http://localhost:8080/api/attendance/break-start?userId=${userId}`);
      await fetchTodayAttendance();
      alert("休憩開始打刻が完了しました");
    } catch (error) {
      alert("休憩開始打刻に失敗しました");
    }
  };

  // 休憩終了打刻
  const endBreak = async () => {
    if (!userId) return;
    try {
      await axios.put(`http://localhost:8080/api/attendance/break-end?userId=${userId}`);
      await fetchTodayAttendance();
      alert("休憩終了打刻が完了しました");
    } catch (error) {
      alert("休憩終了打刻に失敗しました");
    }
  };

  // 退勤打刻
  const endWork = async () => {
    if (!userId) return;
    try {
      await axios.put(`http://localhost:8080/api/attendance/end?userId=${userId}`);
      await fetchTodayAttendance();
      await fetchAttendances();
      alert("退勤打刻が完了しました");
    } catch (error) {
      alert("退勤打刻に失敗しました");
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "未記録";
    return new Date(timeString).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // 編集モーダルを開く
  const openEditModal = (attendance: Attendance) => {
    setEditingAttendance({ ...attendance });
    setIsEditModalOpen(true);
  };

  // 編集モーダルを閉じる
  const closeEditModal = () => {
    setEditingAttendance(null);
    setIsEditModalOpen(false);
  };

  // 勤怠記録を更新
  const updateAttendance = async () => {
    if (!editingAttendance) return;
    
    try {
      await axios.put(`http://localhost:8080/api/attendance/${editingAttendance.id}`, {
        startTime: editingAttendance.startTime,
        breakStartTime: editingAttendance.breakStartTime,
        breakEndTime: editingAttendance.breakEndTime,
        endTime: editingAttendance.endTime,
        status: editingAttendance.status
      });
      
      await fetchAttendances();
      if (todayAttendance && todayAttendance.id === editingAttendance.id) {
        await fetchTodayAttendance();
      }
      closeEditModal();
      alert("勤怠記録を更新しました");
    } catch (error) {
      alert("更新に失敗しました");
    }
  };

  // 勤怠記録を削除
  const deleteAttendance = async (id: number) => {
    if (!confirm("この勤怠記録を削除しますか？")) return;
    
    try {
      await axios.delete(`http://localhost:8080/api/attendance/${id}`);
      await fetchAttendances();
      if (todayAttendance && todayAttendance.id === id) {
        setTodayAttendance(null);
      }
      alert("勤怠記録を削除しました");
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  // 時間フォーマット関数（編集用）
  const formatTimeForInput = (timeString?: string) => {
    if (!timeString) return "";
    return new Date(timeString).toISOString().slice(0, 16);
  };

  // 編集フォームの値更新
  const updateEditForm = (field: string, value: string) => {
    if (!editingAttendance) return;
    
    setEditingAttendance({
      ...editingAttendance,
      [field]: value ? new Date(value).toISOString() : null
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>勤怠登録アプリ</h1>
      
      {/* 今日の勤怠状況 */}
      <div className={styles.todaySection}>
        <h2>今日の勤怠状況</h2>
        {todayAttendance ? (
          <div className={styles.todayInfo}>
            <p>状況: {todayAttendance.status}</p>
            <p>出勤時間: {formatTime(todayAttendance.startTime)}</p>
            <p>休憩開始: {formatTime(todayAttendance.breakStartTime)}</p>
            <p>休憩終了: {formatTime(todayAttendance.breakEndTime)}</p>
            <p>退勤時間: {formatTime(todayAttendance.endTime)}</p>
          </div>
        ) : (
          <p>今日の勤怠記録はありません</p>
        )}
      </div>

      {/* 打刻ボタン */}
      <div className={styles.buttonSection}>
        <button 
          className={styles.button} 
          onClick={startWork}
          disabled={todayAttendance !== null}
        >
          出勤
        </button>
        <button 
          className={styles.button} 
          onClick={startBreak}
          disabled={!todayAttendance || todayAttendance.status !== "WORKING"}
        >
          休憩開始
        </button>
        <button 
          className={styles.button} 
          onClick={endBreak}
          disabled={!todayAttendance || todayAttendance.status !== "ON_BREAK"}
        >
          休憩終了
        </button>
        <button 
          className={styles.button} 
          onClick={endWork}
          disabled={!todayAttendance || todayAttendance.status === "FINISHED"}
        >
          退勤
        </button>
      </div>

      {/* 勤怠記録一覧 */}
      <div className={styles.historySection}>
        <h2>勤怠記録履歴</h2>
        <ul className={styles.memoList}>
          {attendances.map(attendance => (
            <li key={attendance.id} className={styles.memoItem}>
              <div className={styles.attendanceRecord}>
                <span className={styles.workDate}>{formatDate(attendance.workDate)}</span>
                <span>出勤: {formatTime(attendance.startTime)}</span>
                <span>休憩: {formatTime(attendance.breakStartTime)} - {formatTime(attendance.breakEndTime)}</span>
                <span>退勤: {formatTime(attendance.endTime)}</span>
                <span className={styles.status}>状況: {attendance.status}</span>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.editButton} 
                    onClick={() => openEditModal(attendance)}
                  >
                    編集
                  </button>
                  <button 
                    className={styles.deleteButton} 
                    onClick={() => deleteAttendance(attendance.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && editingAttendance && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>勤怠記録編集</h3>
            <div className={styles.editForm}>
              <label>
                出勤時間:
                <input
                  type="datetime-local"
                  value={formatTimeForInput(editingAttendance.startTime)}
                  onChange={(e) => updateEditForm('startTime', e.target.value)}
                  className={styles.timeInput}
                />
              </label>
              
              <label>
                休憩開始:
                <input
                  type="datetime-local"
                  value={formatTimeForInput(editingAttendance.breakStartTime)}
                  onChange={(e) => updateEditForm('breakStartTime', e.target.value)}
                  className={styles.timeInput}
                />
              </label>
              
              <label>
                休憩終了:
                <input
                  type="datetime-local"
                  value={formatTimeForInput(editingAttendance.breakEndTime)}
                  onChange={(e) => updateEditForm('breakEndTime', e.target.value)}
                  className={styles.timeInput}
                />
              </label>
              
              <label>
                退勤時間:
                <input
                  type="datetime-local"
                  value={formatTimeForInput(editingAttendance.endTime)}
                  onChange={(e) => updateEditForm('endTime', e.target.value)}
                  className={styles.timeInput}
                />
              </label>
              
              <label>
                状況:
                <select
                  value={editingAttendance.status}
                  onChange={(e) => setEditingAttendance({...editingAttendance, status: e.target.value})}
                  className={styles.statusSelect}
                >
                  <option value="WORKING">勤務中</option>
                  <option value="ON_BREAK">休憩中</option>
                  <option value="FINISHED">退勤済み</option>
                </select>
              </label>
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.saveButton} onClick={updateAttendance}>
                保存
              </button>
              <button className={styles.cancelButton} onClick={closeEditModal}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <button
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