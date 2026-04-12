# Cài đặt minh họa PCA

## Quy trình sử dụng

Nên sử dụng ứng dụng theo thứ tự 4 bước tương ứng với 4 Tab sau đây:

### 1. Tab Dữ liệu
*   **Mục tiêu:** Tải và chuẩn bị dữ liệu đầu vào.
*   **Cách dùng:** 
    *   Sử dụng thanh bên để tải lên tệp tin `.csv`.
    *   Xem bảng dữ liệu để chọn các cột dữ liệu số cần phân tích.
    *   Thiết lập **Chuẩn hóa (Z-score)** nếu cần đưa các biến về cùng đơn vị.

### 2. Tab Scree Plot
*   **Mục tiêu:** Xác định số lượng thành phần chính và hiểu ý nghĩa của chúng.
*   **Cách dùng:**
    *   **Scree Plot:** Quan sát điểm khuỷu tay để chọn số lượng thành phần chính $k$ (điều chỉnh ở thanh bên).
    *   **Bảng phương sai:** Theo dõi % phương sai tích lũy (nên đạt trên 80-90%).
    *   **Loadings Heatmap:** Xem các biến gốc đóng góp bao nhiêu vào mỗi PC. Màu đậm hơn thể hiện sự ảnh hưởng mạnh hơn.

### 3. Tab Scatter Plot
*   **Mục tiêu:** Trực quan hóa dữ liệu trong không gian mới.
*   **Cách dùng:**
    *   Chọn các trục PC để xem sự phân tán của dữ liệu (mặc định PC1 và PC2).
    *   Sử dụng tính năng **Biến phân lớp** để tô màu các điểm dữ liệu và quan sát phân cụm.
    *   Có thể chuyển đổi sang chế độ **Gốc** để so sánh trực tiếp các cặp biến ban đầu.

### 4. Tab Hotelling's & Residual T²
*   **Mục tiêu:** Phát hiện điểm ngoại lai (outlier) và dị biệt (anomaly).
*   **Cách dùng:**
    *   **Hotelling's T²:** Phát hiện các điểm nằm xa tâm nhưng vẫn nằm trong mặt phẳng mô hình (ngoại lai).
    *   **Residual T²:** Phát hiện các điểm không phù hợp với mô hình PCA (dị biệt).
    *   Điều chỉnh **Độ tin cậy (Confidence Level)** để thay đổi ngưỡng kiểm soát.

---

## Các module được dùng

*   **Frontend:** React.js, Vite, Tailwind CSS.
*   **Biểu đồ:** Chart.js, React-chartjs-2.
*   **Xử lý dữ liệu:** 
    *   `ml-pca`: Thuật toán PCA chính.
    *   `papaparse`: Đọc và xử lý file CSV.
    *   `jstat`: Tính toán các chỉ số thống kê (Chi-square).

## Hướng dẫn chạy trên máy cục bộ

1.  Cài đặt dependencies:
    ```bash
    npm install
    ```
2.  Chạy ứng dụng (Development):
    ```bash
    npm run dev
    ```
3.  Xây dựng bản chính thức (Build):
    ```bash
    npm run build
    ```
