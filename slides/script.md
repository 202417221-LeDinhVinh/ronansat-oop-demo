# RonanSAT — Kịch Bản Thuyết Trình OOP Lab (10 - 12 Phút)

- **Người trình bày:** Lê Vinh - MSSV: 202417221
- **Nhóm:** Nhóm 08
- **Môn học:** Thực hành Lập trình hướng đối tượng (Object-Oriented Programming Lab)
- **Đơn vị:** Viện Công nghệ Thông tin và Truyền thông (School of ICT) — Đại học Bách khoa Hà Nội (HUST)

---

## Slide 1 - Title: RonanSAT: OOP Lab Architecture
Em xin kính chào thầy và các bạn. Hôm nay em xin đại diện nhóm 08 trình bày về thiết kế hướng đối tượng và kiến trúc phân lớp của dự án RonanSAT — Nền tảng luyện thi chuẩn hóa Digital SAT. Bài thuyết trình của em sẽ kéo dài khoảng 10 đến 12 phút, gồm 3 phần chính: thứ nhất là mô hình thực thể và hệ thống kiểu dữ liệu; thứ hai là kiến trúc phân lớp cùng các nguyên lý OOP được áp dụng trong mã nguồn; và thứ ba là phần demo trực tiếp MVP cùng định hướng nâng cấp tính đa hình trong tương lai.

---

## Slide 2 - Project Overview: RonanSAT MVP Scope
RonanSAT là hệ thống mô phỏng bài thi Digital SAT thực tế, hỗ trợ học sinh làm bài thi bấm giờ gồm 2 phần Reading & Writing và Math với tích hợp máy tính đồ thị Desmos trực tiếp trên giao diện. Ngay sau khi nộp bài, hệ thống chấm điểm tự động và quy đổi theo thang chuẩn SAT 400 đến 1600, kèm bảng tổng hợp lỗi sai và lời giải thích chi tiết cho từng câu hỏi. Bộ demo hiện tại đã được nạp sẵn 2 đề thi thật từ dữ liệu sản xuất với 171 câu trắc nghiệm, chạy hoàn toàn offline thông qua MongoDB in-memory mà không cần cấu hình thêm bất kỳ tài khoản ngoài nào.

---

## Slide 3 - Why TypeScript Supports OOP in RonanSAT
Dự án của chúng em được xây dựng hoàn toàn bằng TypeScript trên nền Next.js và React. TypeScript đóng vai trò là nền tảng hướng đối tượng mạnh mẽ cho hệ thống thông qua kiểm tra kiểu tĩnh ở thời điểm biên dịch, giúp phát hiện sớm các lỗi dữ liệu trước khi chạy. Chúng em định nghĩa các interface như IUser, ITest, IQuestion làm hợp đồng dữ liệu rõ ràng giữa UI và database. Đồng thời, TypeScript cung cấp đầy đủ các từ khóa của OOP như class, private, readonly và generics, giúp mã nguồn vừa an toàn vừa giữ được tính đóng gói cao.

> **Nếu thầy hỏi:** *TypeScript bản chất biên dịch ra JavaScript thì tính hướng đối tượng có thực sự tồn tại ở runtime không?*  
> **Trả lời:** *Dạ thưa thầy, ở runtime JavaScript hoạt động theo prototype, nhưng TypeScript đóng vai trò là "lớp bảo vệ hợp đồng" ở compile-time. Tất cả các vi phạm về đóng gói, kiểu dữ liệu hay truy cập trường private đều bị trình biên dịch chặn lại ngay từ lúc dev gõ phím, đảm bảo tính kỷ luật OOP trước khi code được triển khai.*

---

## Slide 4 - System Use Case Diagram: Student Practice & Tutoring
Trên màn hình là sơ đồ Use Case dành cho luồng học sinh (Student). Học sinh là tác nhân chính tương tác với phân hệ Practice & Assessment: duyệt kho đề, tham gia thi thử có bấm giờ kèm máy tính Desmos, nộp bài để tính điểm tự động và xem lại lời giải chi tiết. Đồng thời, học sinh có thể tương tác với phân hệ AI Tutoring thông qua Gemini AI để nhận hướng dẫn giải thích câu hỏi khi gặp khó khăn. Mọi tương tác trong phân hệ này được thiết kế theo luồng trực quan từ trái sang phải.

---

## Slide 5 - System Use Case Diagram: Administration & Authentication
Slide này thể hiện sơ đồ Use Case dành cho quản trị viên và các dịch vụ nền tảng dùng chung. Cả học sinh và quản trị viên đều đi qua phân hệ Core Account Services để đăng ký và xác thực tài khoản qua NextAuth, cũng như quản lý hồ sơ cá nhân. Phía quản trị viên (Admin) sở hữu các quyền tác vụ chuyên biệt: tạo đề thi mới, soạn thảo câu hỏi kèm đoạn văn đọc hiểu và quản lý bảng vinh danh học sinh xuất sắc (Hall of Fame).

---

## Slide 6 - Layered Architecture: Separation of Concerns
Để đảm bảo tính tổ chức và dễ bảo trì, chúng em tổ chức mã nguồn theo kiến trúc 4 tầng phân lớp rõ rệt:
1. API Route (`app/api/*`) tiếp nhận request mạng và định tuyến theo giao thức HTTP.
2. Controller (`lib/controllers/*`) phân tích tham số truy vấn, xác thực phiên đăng nhập và định dạng HTTP status code.
3. Service Layer (`lib/services/*`) chứa toàn bộ logic nghiệp vụ, kiểm tra tính hợp lệ qua Zod và tính điểm.
4. Model Layer (`lib/models/*`) định nghĩa schema Mongoose, các interface miền và thực hiện lưu trữ dữ liệu.
Luồng phụ thuộc đi theo một chiều từ trên xuống dưới: route gọi controller, controller gọi service, và chỉ service mới trực tiếp thao tác với model.

> **Nếu thầy hỏi:** *Tại sao Next.js đã có Route Handler rồi mà em vẫn tách thêm Controller và Service?*  
> **Trả lời:** *Dạ thưa thầy, Route Handler của Next.js chỉ nên làm nhiệm vụ định tuyến giao thức mạng. Tách riêng Controller và Service giúp tách biệt hoàn toàn giữa logic giao tiếp HTTP và logic nghiệp vụ. Khi chuyển sang framework khác như Express hay NestJS, toàn bộ tầng Service nghiệp vụ của em vẫn được tái sử dụng nguyên vẹn.*

---

## Slide 7 - Layered Class Diagram: Tests & Questions Flows
Sơ đồ lớp kiến trúc này thể hiện chi tiết hai luồng dữ liệu cốt lõi: Quản lý bài thi (Tests) và Câu hỏi (Questions). Ở mỗi luồng, Route handler chuyển tiếp lời gọi đến Controller tương ứng (`testController`, `questionController`). Controller ủy quyền cho Service (`testService`, `questionService`) xử lý. Tầng Service sử dụng các Zod schema (`TestValidationSchema`, `QuestionValidationSchema`) để xác thực dữ liệu trước khi lưu trữ vào các model `ITest` và `IQuestion`.

---

## Slide 8 - Layered Class Diagram: Results & Chat Flows
Slide tiếp theo thể hiện hai luồng nghiệp vụ còn lại: Quản lý kết quả thi (Results) và Phiên hội thoại với trợ lý học tập (Chat). Tương tự, `resultController` và `chatController` tiếp nhận yêu cầu từ client, gọi sang `resultService` và `chatService`. Các truy vấn database được giữ trọn vẹn bên trong tầng Service, giúp tầng điều khiển hoàn toàn độc lập với chi tiết lưu trữ MongoDB.

---

## Slide 9 - Domain Model Class Diagram: Entities & Relationships
Đây là sơ đồ lớp mô hình thực thể miền (Domain Class Diagram) thể hiện đầy đủ các thuộc tính, kiểu dữ liệu và mối liên kết giữa các thực thể: `User`, `Test`, `Section`, `Question`, `Result`, `IAnswer`, và `Chat`. Tất cả các quan hệ đều được định lượng rõ ràng với các số lượng liên kết (multiplicities) chuẩn UML như 1, 1..*, 0..*.

---

## Slide 10 - Domain Model: Multiplicities & Composition Analysis
Trên slide này, nhóm em phân tích chi tiết quyết định thiết kế giữa Composition và Aggregation:
- **Composition (Quan hệ Hợp thành):** Chúng em áp dụng cho những thành phần không thể tồn tại độc lập bên ngoài thực thể cha. Cụ thể, `Section` được nhúng trực tiếp trong `Test` (`sections: [SectionSchema]`), và `IAnswer` được nhúng trực tiếp trong `Result` (`answers: [AnswerSchema]`). Khi bản ghi cha bị xóa, các thành phần con này sẽ tự động bị dọn dẹp theo.
- **Aggregation / Association (Quan hệ Tập hợp / Liên kết):** Áp dụng cho các thực thể có vòng đời độc lập. `Question` là một collection riêng biệt trong ngân hàng câu hỏi, được `Test` liên kết thông qua mảng ObjectId (`testId`).

> **Nếu thầy hỏi:** *Tại sao Section lại dùng Composition mà Question lại dùng Association với Test?*  
> **Trả lời:** *Dạ thưa thầy, Section là cấu trúc gắn liền của đề thi (thời gian làm bài, số lượng câu của module đó) nên khi xóa đề thi thì Section cũng biến mất cùng Test, vì vậy em dùng embedded schema (Composition). Còn Question là một thực thể độc lập có ngân hàng câu hỏi riêng, có nội dung đọc hiểu và hình vẽ, nên được lưu thành collection riêng và liên kết qua ObjectId (Aggregation).*

---

## Slide 11 - Encapsulation: Protecting Sensitive State & Boundaries
Tính đóng gói (Encapsulation) được thể hiện rất rõ trong việc bảo vệ dữ liệu nhạy cảm của người dùng. Trong UserSchema, trường password được cấu hình `select: false`, nghĩa là mọi truy vấn thông thường của ứng dụng sẽ không bao giờ trả về mật khẩu người dùng. Chỉ duy nhất trong hàm authorize của NextAuth, hệ thống mới gọi tường minh `.select("+password")` để tiến hành so sánh băm bằng bcrypt. Đồng thời, hàm dbConnect đóng gói toàn bộ logic kết nối MongoDB và bộ nhớ đệm kết nối, che giấu chi tiết kỹ thuật khỏi các tầng bên trên.

> **Nếu thầy hỏi:** *Tính đóng gói ở đây khác gì so với thuộc tính private trong class Java?*  
> **Trả lời:** *Dạ thưa thầy, ở mức độ ứng dụng database, việc đặt `select: false` trong schema là kỹ thuật đóng gói phòng thủ sâu (defense-in-depth). Dù lập trình viên ở tầng Controller có lỡ tay trả về cả object User ra JSON, trường mật khẩu vẫn được che giấu tự động từ cấp độ model, ngăn ngừa rò rỉ thông tin.*

---

## Slide 12 - Abstraction via Interfaces: Decoupling Contracts
Tính trừu tượng (Abstraction) được thể hiện qua các TypeScript interface như IUser, ITest, IQuestion và IResult. Tầng Controller khi làm việc chỉ phụ thuộc vào chữ ký phương thức của Service, ví dụ như `testService.getTests(page, limit, sortBy, sortOrder)`, mà hoàn toàn không cần biết bên dưới Service sử dụng câu lệnh MongoDB gì, phân trang theo công thức skip-limit nào. Khách hàng sử dụng dịch vụ chỉ cần quan tâm đến kết quả trả về đúng theo hợp đồng giao diện đã cam kết.

---

## Slide 13 - Inheritance & Composition: Real Structure in Code
Trên slide là bảng tổng hợp các quan hệ kế thừa và kết hợp trong mã nguồn thực tế. Về kế thừa, các interface mô hình mở rộng trực tiếp từ interface Document của Mongoose để kế thừa các phương thức vòng đời như `.save()`, `.populate()` và trường `_id`. Về kết hợp, chúng em ưu tiên nguyên lý "Composition over Inheritance": Test kết hợp nhúng SectionSchema, và Result kết hợp nhúng AnswerSchema. Các câu hỏi được liên kết dạng tham chiếu để đảm bảo hiệu năng truy vấn tối ưu.

> **Nếu thầy hỏi:** *Tại sao các model trong code không dùng kế thừa class (class A extends B) mà lại dùng interface extends Document?*  
> **Trả lời:** *Dạ thưa thầy, trong kiến trúc hướng văn bản (document-oriented) của MongoDB và Mongoose, việc lạm dụng kế thừa class phức tạp thường dẫn đến vấn đề impedance mismatch và khó ánh xạ BSON. Vì vậy nhóm em tuân thủ best practice của Mongoose và TypeScript: dùng interface inheritance cho hợp đồng kiểu, và dùng schema composition cho cấu trúc tài liệu.*

---

## Slide 14 - A Concrete OOP Class: ProdSampleImporter
Trong dự án, chúng em có một lớp thuần OOP hoàn chỉnh là `ProdSampleImporter` nằm ở file `lib/seed/prodSampleImporter.ts`. Lớp này thể hiện trọn vẹn các đặc tính của một class: có thuộc tính ẩn danh `private readonly dataFilePath`, có constructor nhận đường dẫn tệp tin, và các phương thức public thực hiện chuẩn hóa dữ liệu, giải quyết đường dẫn ảnh offline bằng băm SHA-256, và nạp bài thi vào cơ sở dữ liệu. Lớp này đóng gói toàn bộ pipeline chuyển đổi dữ liệu từ file JSON xuất xưởng sang các Mongoose model.

---

## Slide 15 - Polymorphism: Honest Codebase Evaluation
Để hoàn toàn trung thực về mặt kỹ thuật, nhóm em xin làm rõ tính đa hình trong mã nguồn hiện tại. Hiện tại, tính đa hình đang được thể hiện qua cơ chế Structural Typing của TypeScript và các phương thức Active Record dùng chung của Mongoose. Các nhánh phân quyền như user/admin hay chế độ làm bài full/sectional hiện đang được xử lý bằng logic rẽ nhánh có điều kiện, chứ chưa triển khai thành một cây phân cấp class đa hình lúc runtime. Chúng em nhận thức rõ hạn chế này và đã lên thiết kế nâng cấp bằng mẫu Strategy Pattern trong các giai đoạn tiếp theo.

> **Nếu thầy hỏi:** *Thầy thấy trong code có phân quyền admin/user và thi full/sectional, tại sao không dùng tính đa hình (subclass) luôn?*  
> **Trả lời:** *Dạ thưa thầy, ở quy mô MVP ban đầu, việc dùng discriminated union type (`role: "user" | "admin"`) giúp code gọn nhẹ và phù hợp với NextAuth session. Tuy nhiên, để tuân thủ triệt để nguyên lý Open-Closed (OCP) của OOP, nhóm em đã lên phương án tái cấu trúc bộ tính điểm thành Strategy Pattern với `IScoringStrategy` để mở rộng thêm nhiều loại đề thi mà không cần sửa code cũ.*

---

## Slide 16 - Sequence: Test Initialization & Question Loading (Part 1)
Sơ đồ tuần tự này mô tả nửa đầu của quy trình thi thử SAT. Khi sinh viên chọn đề thi và truy cập `/test/[id]`, trình duyệt gửi yêu cầu `GET /api/questions` lên API. Yêu cầu đi qua `questionController` rồi đến `questionService` để truy vấn `Question.find()`. Dữ liệu câu hỏi được trả về trình duyệt và ứng dụng khởi tạo `TestEngine`, nạp đồng hồ đếm ngược, đoạn văn đọc hiểu và máy tính Desmos. Toàn bộ câu trả lời của thí sinh được lưu trữ cục bộ trong state React trong suốt thời gian làm bài để đảm bảo tốc độ phản hồi tức thì.

---

## Slide 17 - Sequence: Test Submission, Scoring & Persistence (Part 2)
Nửa sau của quy trình bắt đầu khi sinh viên bấm "Submit Test". Trình duyệt gửi toàn bộ câu trả lời lên endpoint kết quả. `resultController` xác minh phiên đăng nhập của thí sinh qua NextAuth, sau đó chuyển sang `resultService`. Tại đây, Service tạo bản ghi Result chứa mảng câu trả lời nhúng, sau đó cập nhật thông tin của sinh viên gồm danh sách đề đã thi, điểm cao nhất và các câu làm sai. Cuối cùng, kết quả trả về màn hình tổng kết kèm điểm số chi tiết.

---

## Slide 18 - Sequence: User Registration & Password Hashing (Part 1)
Ở quy trình xác thực người dùng, slide này thể hiện luồng đăng ký tài khoản mới. Khi người dùng nhập thông tin tại trang `/auth`, dữ liệu được gửi đến `POST /api/auth/register`. Hệ thống kiểm tra tính duy nhất của email trong cơ sở dữ liệu, sau đó sử dụng thư viện bcryptjs để sinh salt và băm mật khẩu qua 10 vòng mã hóa trước khi tạo bản ghi User mới với vai trò mặc định `"user"`. Mật khẩu dạng văn bản thuần tuyệt đối không bao giờ được ghi vào cơ sở dữ liệu.

---

## Slide 19 - Sequence: Credential Login via NextAuth & JWT (Part 2)
Khi người dùng đăng nhập bằng tài khoản và mật khẩu, hàm authorize của NextAuth được kích hoạt. Điểm mấu chốt của tính đóng gói là hàm này gọi `.select("+password")` để lấy mật khẩu đã băm ra kiểm tra với bcrypt. Sau khi xác thực thành công, callback JWT sẽ gắn định danh và vai trò của người dùng vào token được ký điện tử, gửi về client qua cookie được mã hóa an toàn.

---

## Slide 20 - Sequence: Protected Route & Role Resolution (Part 3)
Slide này thể hiện cách hệ thống giải quyết phiên làm việc khi người dùng truy cập các trang được bảo vệ như `/admin` hoặc xem lại bài thi `/review`. Trình duyệt gửi kèm session cookie, callback `session()` của NextAuth trích xuất `token.role`. Nếu người dùng mang vai trò `admin`, hệ thống cho phép truy cập bảng điều khiển quản trị; nếu là học sinh, quyền truy cập các tính năng luyện thi được kích hoạt.

---

## Slide 21 - MVP Demonstration: Production UI & KaTeX Rendering
Đây là các hình ảnh chụp thực tế từ ứng dụng đang chạy ở kích thước lớn. Hình bên trái thể hiện khả năng render công thức toán học chuyên sâu bằng thư viện KaTeX, hiển thị phân số và số mũ chuẩn xác bên cạnh các câu hỏi SAT thực tế. Hình bên phải là giao diện ma trận câu hỏi xem lại bài thi với các chấm tròn mã màu phân loại câu đúng và sai theo đúng số lượng câu của đề thật. Toàn bộ demo có thể chạy ngay với lệnh duy nhất `npm run demo`.

---

## Slide 22 - Limitations & OOP Refactoring Roadmap
Nhìn nhận khách quan, dự án hiện có 3 điểm cần tiếp tục hoàn thiện về mặt OOP: thứ nhất là các service hiện là singleton object literal cần được chuyển thành class hoàn chỉnh; thứ hai là cần bổ sung lớp trừu tượng `BaseService<T>` hỗ trợ các hàm CRUD tổng quát; và thứ ba là áp dụng Strategy Pattern cho bộ tính điểm SAT. Nhóm em đã thiết kế sẵn interface `IScoringStrategy` với hai lớp triển khai `FullLengthSATScoring` và `SectionalScoring` để thay thế hoàn toàn các lệnh `if/else` hiện tại.

---

## Slide 23 - Conclusion & Q&A
Tóm lại, dự án RonanSAT đã đạt được các mục tiêu quan trọng về thiết kế hướng đối tượng: kiến trúc 4 tầng phân lớp rõ ràng, bảo vệ dữ liệu nhạy cảm qua đóng gói nhiều tầng, trừu tượng hóa bằng interface TypeScript, và nạp dữ liệu thi thật thông qua lớp `ProdSampleImporter`. Em xin chân thành cảm ơn thầy đã chú ý lắng nghe bài thuyết trình của nhóm 08. Em rất mong nhận được những nhận xét và câu hỏi góp ý từ thầy ạ!

---

## Phụ Lục: Lộ Trình Thao Tác Demo Trực Tiếp (Live Demo Click Path)

### 1. Tài Khoản Demo (Đã nạp sẵn trong hệ thống)
- **Học sinh (Student):** `student@ronansat.com` / `StudentPassword123!`
- **Quản trị viên (Admin):** `admin@ronansat.com` / `AdminPassword123!`

### 2. Các Bước Thao Tác Trực Tiếp (Demo Walkthrough)
1. **Khởi chạy ứng dụng:** Chạy lệnh `npm run demo` trên terminal. Hệ thống tự khởi động MongoDB in-memory trên cổng 27018, nạp dữ liệu 2 đề thi và mở web trên `http://localhost:3000`.
2. **Đăng nhập Học sinh:** Truy cập `/auth`, chọn tab "Sign In", nhập email `student@ronansat.com` và mật khẩu `StudentPassword123!`.
3. **Mở đề thi SAT:** Trên trang chủ, chọn bài thi *2025 March INT - A* và bấm "Start Test".
4. **Làm bài & Trải nghiệm công cụ:** 
   - Duyệt qua câu hỏi Reading & Writing (xem đoạn văn trích dẫn bên trái).
   - Chuyển sang câu hỏi Math, mở máy tính Desmos tích hợp để vẽ đồ thị hàm số và xem công thức toán LaTeX KaTeX.
   - Chọn một số đáp án trắc nghiệm và đánh dấu cờ (flag).
5. **Nộp bài thi:** Bấm "Submit Test" và xác nhận nộp bài. Hệ thống chấm điểm tự động và hiển thị điểm tổng (ví dụ 1520/1600) cùng điểm từng phần.
6. **Xem lại câu sai (Review):** Bấm "Review Test" để xem lưới ma trận câu hỏi. Bấm vào một câu hỏi sai để mở popup đối chiếu đáp án chọn và lời giải chi tiết.
7. **Đăng nhập Quản trị viên (Admin):** Đăng xuất, sau đó đăng nhập bằng `admin@ronansat.com` / `AdminPassword123!`.
8. **Trang Quản trị:** Truy cập `/admin`, xem danh sách đề thi đã tạo, bảng quản lý câu hỏi và giao diện tạo đề thi mới.
