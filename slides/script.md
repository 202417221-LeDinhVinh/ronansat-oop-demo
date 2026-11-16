# RonanSAT v2 — Kịch Bản Thuyết Trình OOP Lab (10 - 12 Phút)

- **Người trình bày:** Lê Vinh - MSSV: 202417221
- **Nhóm:** Nhóm 08
- **Môn học:** Thực hành Lập trình hướng đối tượng (Object-Oriented Programming Lab)
- **Đơn vị:** Viện Công nghệ Thông tin và Truyền thông (School of ICT) — Đại học Bách khoa Hà Nội (HUST)

---

## Slide 1 - Title: RonanSAT v2: Real OOP Architecture
Em xin kính chào thầy và các bạn. Hôm nay em xin đại diện Nhóm 08 trình bày kiến trúc hướng đối tượng thực thụ của phiên bản RonanSAT v2 — Nền tảng luyện thi chuẩn hóa Digital SAT. Trong phiên bản này, toàn bộ hệ thống đã được tái thiết kế từ đầu theo chuẩn Clean Architecture và áp dụng triệt để 4 trụ cột OOP cùng các Design Pattern kinh điển của GoF. Bài thuyết trình gồm 3 nội dung trọng tâm: kiến trúc phân lớp và thực thể miền; 4 trụ cột OOP kèm trích đoạn mã nguồn thực tế; và chất lượng kiểm thử với 64 bài unit test tự động cùng kịch bản demo trực tiếp.

---

## Slide 2 - Product Overview: RonanSAT v2 Features
RonanSAT v2 là hệ thống luyện thi Digital SAT toàn diện với 2 phân hệ người dùng chính là Học sinh và Quản trị viên. Phía học sinh có thể làm bài thi bấm giờ gồm 4 module hoàn chỉnh hoặc luyện tập phân đoạn (Sectional) với tích hợp máy tính đồ thị Desmos và công thức toán học KaTeX chuẩn College Board. Hệ thống hỗ trợ song song 2 cơ chế câu hỏi: trắc nghiệm MCQ và câu hỏi điền số/phân số SPR với bộ so khớp dung sai tự động. Đặc biệt, kết quả thi được chấm điểm theo thang SAT thực tế, tự động tổng hợp vào Error Log chống trùng lặp và hỗ trợ học từ vựng SAT theo thuật toán lặp lại ngắt quãng Leitner 5 hộp. Dự án đã nạp sẵn 2 đề thi thật với 171 câu hỏi và chạy hoàn toàn offline qua MongoDB in-memory.

---

## Slide 3 - Technology Stack & Architectural Standards
Về mặt công nghệ, hệ thống sử dụng Next.js 16 và React 19 cho tầng giao diện người dùng, kết hợp bảng màu Warm Studio và Tailwind CSS v4. Các API Route Handler của Next.js được tinh gọn tối đa theo mô hình Thin Route Pattern: mỗi handler chỉ chứa 1 đến 5 dòng ủy quyền toàn bộ cho các lớp Controller OOP. Tầng ứng dụng và tầng miền là các class TypeScript thuần túy được bật chế độ `strict: true` tuyệt đối, không sử dụng kiểu dữ liệu `any`. Kiến trúc tuân thủ nghiêm ngặt nguyên lý Đảo ngược phụ thuộc (DIP), đảm bảo tầng miền hoàn toàn độc lập với thư viện cơ sở dữ liệu Mongoose bên ngoài.

---

## Slide 4 - Layered Architecture: Separation of Concerns
Mã nguồn của RonanSAT v2 được phân chia thành 4 tầng rõ rệt: Tầng HTTP nhận diện request và ủy quyền cho BaseController; Tầng Application chứa các ca sử dụng dưới dạng Service được tiêm phụ thuộc qua constructor; Tầng Domain lưu trữ các thực thể nghiệp vụ thuần túy, Value Object và Scoring Strategy; và Tầng Infrastructure quản lý lưu trữ dữ liệu MongoDB cùng các driver mã hóa. Toàn bộ đồ thị phụ thuộc được khởi tạo tập trung tại Composition Root duy nhất là lớp `Container` Singleton nằm ở `lib/container.ts`.

> **Nếu thầy hỏi:** *Tại sao lại cần tách riêng Tầng Application Service và Tầng Domain Entity thay vì viết hết logic vào Service?*  
> **Trả lời:** *Dạ thưa thầy, Tầng Domain đại diện cho các quy tắc nghiệp vụ cốt lõi không bao giờ thay đổi theo công nghệ, ví dụ như bất biến bài thi đã nộp thì không được sửa câu trả lời. Còn Tầng Application đóng vai trò nhạc trưởng (orchestrator), điều phối việc lấy dữ liệu từ Repository, gọi các phương thức của Domain Entity và lưu lại trạng thái. Tách bạch như vậy giúp logic nghiệp vụ độc lập hoàn toàn với database và framework.*

---

## Slide 5 - Layered Architecture: Practice & Vocab Controllers & Services (UML 03a1)
Trên màn hình là sơ đồ lớp kiến trúc của tầng HTTP Controller và Application Service phục vụ phân hệ Luyện tập và Học từ vựng. Các controller chuyên biệt như `SubmitAttemptController`, `RecordAnswerController` hay `ReviewVocabCardController` đều kế thừa từ lớp trừu tượng `BaseController`. Lớp cơ sở này cài đặt mẫu thiết kế Template Method thông qua phương thức `handle()`, tự động thực hiện chuỗi kiểm tra xác thực, phân quyền và kiểm tra dữ liệu bằng Zod trước khi kích hoạt `execute()` để điều phối tới `PracticeService` và `VocabService` được tiêm phụ thuộc qua constructor.

---

## Slide 6 - Layered Architecture: Auth & Administration Controllers & Services (UML 03a2)
Tiếp nối kiến trúc phân lớp, sơ đồ này thể hiện tầng điều khiển cho phân hệ Xác thực và Quản trị nền tảng. Các controller như `RegisterController`, `AdminTestsController` và `AdminMetricsController` cũng áp dụng nghiêm ngặt khung Template Method từ `BaseController`. Khi người dùng đăng ký hoặc quản trị viên thao tác theo dõi chỉ số hệ thống và ngân hàng đề thi, controller kiểm tra phiên làm việc và quyền hạn cấp cao, sau đó ủy quyền xử lý nghiệp vụ cho `AuthService` và `AdminService`, đảm bảo tính an toàn và chuẩn hóa dữ liệu đầu vào.

---

## Slide 7 - Persistence Architecture: Generic Repositories, Ports & Container (UML 03b)
Slide này thể hiện kiến trúc lưu trữ dữ liệu với việc áp dụng mẫu thiết kế Repository và Dependency Inversion. Tầng ứng dụng chỉ giao tiếp thông qua hợp đồng giao diện tổng quát `IRepository<T, TId>` và các interface chuyên biệt như `IAttemptRepository` hay `Clock`. Lớp trừu tượng `MongoRepository` định nghĩa khung chuyển đổi Document-Entity theo Template Method, trong khi các lớp `InMemoryRepository` giúp chạy unit test độc lập không cần MongoDB. Lớp `Container` Singleton đóng vai trò nhà máy lắp ráp toàn bộ hệ thống ngay khi ứng dụng khởi động.

> **Nếu thầy hỏi:** *Việc dùng In-memory Repository ở đây mang lại lợi ích gì so với mock trực tiếp bằng Jest/Vitest?*  
> **Trả lời:** *Dạ thưa thầy, việc có sẵn lớp `InMemory*Repository` cài đặt trọn vẹn interface `IRepository` cho phép chúng em kiểm thử hành vi lưu trữ và nghiệp vụ một cách chân thực nhất mà không cần phụ thuộc vào thư viện mock của bên thứ ba, đồng thời tốc độ thực thi cực nhanh: toàn bộ 64 unit test chạy xong dưới 2 giây.*

---

## Slide 8 - System Use Case Model: Student Practice, Error Log & Vocab Lifecycle (UML 04a)
Đây là sơ đồ ca sử dụng chi tiết dành cho tác nhân Học sinh, được thiết kế theo luồng phẳng chuẩn mực với 0 đường giao cắt chéo. Học sinh là trung tâm của 4 nhóm ca sử dụng lớn: Làm bài thi thử (gồm Full-Length 4 module hoặc Sectional với tích hợp máy tính Desmos và công thức KaTeX); Tra cứu kết quả thi và xem ma trận điểm chi tiết; Quản lý sổ tay lỗi sai Error Log với cơ chế khử trùng lặp và làm lại câu sai trực tiếp; và cuối cùng là Ôn tập từ vựng Flashcard theo thuật toán dãn cách Leitner 5 hộp.

---

## Slide 9 - System Use Case Model: Platform Administration & Content Workflows (UML 04b)
Sơ đồ ca sử dụng tiếp theo dành riêng cho tác nhân Quản trị viên, cũng được thiết kế chuẩn xác với 0 đường giao cắt. Quản trị viên được xác thực qua cơ chế RBAC và làm chủ 2 nhóm nghiệp vụ chính: Quản lý nền tảng và bài thi (giám sát các chỉ số KPI, cấu hình thời gian thi, xuất bản bài thi); và Quản lý nội dung học thuật (soạn thảo câu hỏi trắc nghiệm MCQ, cấu hình quy tắc và dung sai câu hỏi điền số SPR, quản trị người dùng và biên tập các bộ từ vựng SAT).

---

## Slide 10 - OOP Pillar 1: Encapsulation & Invariant Protection
Trụ cột đầu tiên là Tính Đóng Gói (Encapsulation). Trong RonanSAT v2, các trường trạng thái nội bộ của Entity như `_status`, `_answers`, hay `_score` đều được khai báo `private` và chỉ truy cập qua getter đọc. Các bất biến nghiệp vụ (domain invariants) được bảo vệ tuyệt đối: ví dụ trong phương thức `recordAnswer()`, nếu bài thi đã ở trạng thái `submitted`, hệ thống sẽ ném ngay lỗi `InvariantViolationError`. Tương tự, các Value Object như `ScaledScore` và `Email` tự kiểm tra tính hợp lệ ngay trong hàm khởi tạo, ngăn chặn việc tạo ra các đối tượng ở trạng thái không hợp lệ.

> **Nếu thầy hỏi:** *Tại sao lại dùng Value Object cho ScaledScore và Email thay vì dùng kiểu number và string có sẵn?*  
> **Trả lời:** *Dạ thưa thầy, kiểu primitive number hay string không thể tự bảo vệ ràng buộc nghiệp vụ. Ví dụ `ScaledScore` bắt buộc tổng điểm phải từ 400 đến 1600 hoặc điểm sectional từ 200 đến 800. Đóng gói vào Value Object đảm bảo bất kỳ nơi nào trong hệ thống sở hữu đối tượng này đều chắc chắn mang giá trị hợp lệ mà không cần kiểm tra lại.*

---

## Slide 11 - OOP Pillar 2: Abstraction via Decoupled Contracts
Trụ cột thứ hai là Tính Trừu Tượng (Abstraction) thông qua các hợp đồng giao diện tách rời. Các nghiệp vụ cấp cao không bao giờ import trực tiếp các thư viện cấp thấp như Mongoose hay thời gian của hệ điều hành. Thay vào đó, chúng phụ thuộc vào các Port Interface như `ScoringStrategy`, `IRepository`, và `Clock`. Trong đoạn code trích dẫn, `PracticeService` nhận các port này qua constructor, cho phép hoán đổi bộ tính điểm hoặc nguồn thời gian kiểm thử một cách minh bạch mà không cần sửa bất kỳ dòng mã nghiệp vụ nào.

> **Nếu thầy hỏi:** *Tại sao phải trừu tượng hóa Clock thành interface thay vì gọi thẳng `new Date()` trong service?*  
> **Trả lời:** *Dạ thưa thầy, các thuật toán học từ vựng lặp lại ngắt quãng (Leitner) phụ thuộc chặt chẽ vào thời gian. Nếu gọi `new Date()`, việc viết unit test kiểm tra thẻ có "đến hạn ôn tập sau 3 ngày" sẽ rất khó khăn và phải dùng hàm sleep. Với interface `Clock`, em có thể tiêm một mock clock có thời gian cố định hoặc nhảy cóc thời gian tùy ý trong unit test.*

---

## Slide 12 - OOP Pillar 3: Inheritance & Template Method Hierarchy
Trụ cột thứ ba là Tính Kế Thừa (Inheritance) được tổ chức theo hệ thống phân cấp chặt chẽ. Lớp trừu tượng `Entity<TId>` cung cấp logic so sánh định danh (`equals()`) được kế thừa bởi tất cả các thực thể trong miền như `User`, `Test`, `Question`, và `Attempt`. Cụ thể với câu hỏi, lớp trừu tượng `Question` định nghĩa các phương thức trừu tượng `isCorrect()` và `questionType`, sau đó được chuyên biệt hóa bởi `MultipleChoiceQuestion` và `StudentProducedResponseQuestion`. Ngoài ra, tính kế thừa còn được kết hợp với Template Method trên lớp `BaseController`.

---

## Slide 13 - OOP Pillar 4: Runtime Polymorphic Dispatch
Trụ cột thứ tư là Tính Đa Hình (Polymorphism) tại thời điểm thực thi. Thay vì dùng các câu lệnh rẽ nhánh `switch-case` hay `if-else` theo loại câu hỏi, phương thức `question.isCorrect(userAnswer)` được điều phối động tới lớp con tương ứng: so sánh chuỗi chính xác với câu hỏi trắc nghiệm MCQ, nhưng lại tính toán dung sai số học và quy đổi phân số tương đương đối với câu hỏi SPR. Tương tự, phương thức `user.canAccessAdmin()` trả về `false` đối với `Student` và `true` đối với `Admin`, thể hiện chuẩn xác nguyên lý thay thế Liskov (LSP).

> **Nếu thầy hỏi:** *Đa hình trong việc chấm điểm được thể hiện ở chỗ nào trong mã nguồn?*  
> **Trả lời:** *Dạ thưa thầy, khi học sinh nộp bài, phương thức `Attempt.submit(strategy, questions)` chỉ gọi `strategy.score(this, questions)`. Tại runtime, biến `strategy` có thể là `FullLengthScoringStrategy` (chấm theo thang 400-1600) hoặc `SectionalScoringStrategy` (chấm theo thang 200-800) mà bản thân lớp `Attempt` không cần biết chi tiết thuật toán bên trong.*

---

## Slide 14 - Polymorphism in Action: Strategy Pattern for Exam Scoring (UML 02)
Sơ đồ trên màn hình minh họa cụ thể mẫu thiết kế Strategy cho nghiệp vụ tính điểm bài thi SAT. Interface `ScoringStrategy` định nghĩa chữ ký chuẩn nhận vào `Attempt` và danh sách câu hỏi để tạo ra đối tượng bất biến `ScaledScore`. Lớp `ScoringStrategyFactory` đóng vai trò đóng gói logic khởi tạo strategy dựa trên chế độ thi của bài làm. Nhờ đó, việc mở rộng thêm các thang điểm mới trong tương lai như PSAT 8/9 hay PSAT/NMSQT chỉ cần thêm một lớp mới mà không làm thay đổi lớp `Attempt`.

---

## Slide 15 - Domain Model: Core Foundation & User RBAC Subtyping (UML 01a1)
Sơ đồ mô tả nền tảng miền DDD và hệ thống phân cấp người dùng. Lớp cơ sở trừu tượng `Entity<TId>` và `ValueObject` cung cấp nhận dạng và kiểm tra bằng nhau theo cấu trúc. `Email` là Value Object hợp lệ hóa định dạng. Hệ thống phân cấp `User` phân tách thành `Student` với các thuộc tính theo dõi bài thi đã làm, điểm cao nhất và `Admin` với thẩm quyền quản trị hệ thống.

---

## Slide 16 - Domain Model: Test Aggregate & Polymorphic Questions (UML 01a2)
Sơ đồ tập trung vào đề thi và ngân hàng câu hỏi đa hình. `Test` là Aggregate Root sở hữu các phần thi `Section` thông qua quan hệ hợp thành (Composition `*--`) và chứa danh sách tham chiếu tới `Question`. Lớp cơ sở trừu tượng `Question` định nghĩa phương thức `isCorrect()*` được hiện thực hóa đa hình bởi `MultipleChoiceQuestion` (MCQ) và `StudentProducedResponseQuestion` (SPR).

---

## Slide 17 - Domain Model: Exam Sitting Aggregate & Deduplicated Error Log (UML 01b1)
Sơ đồ thực thể quá trình làm bài và sổ tay câu sai. `Attempt` là Aggregate Root quản lý trạng thái buổi thi, sở hữu các bản ghi câu trả lời bất biến `AnswerRecord` và điểm số chuẩn hóa `ScaledScore`. Khi bài thi có câu trả lời sai, hệ thống kích hoạt và ghi nhận lỗi vào `ErrorLogEntry` với cơ chế tự động khử trùng lặp theo cặp người dùng - câu hỏi.

---

## Slide 18 - Domain Model: Vocabulary Spaced Repetition Domain (UML 01b2)
Sơ đồ biểu diễn miền ôn tập từ vựng lặp lại ngắt quãng (Leitner 5-box). `VocabDeck` là Aggregate Root quản lý danh sách thẻ từ `VocabCard`. Nghiệp vụ ôn tập sử dụng mẫu Strategy qua interface `ReviewScheduler` và hiện thực `LeitnerScheduler` để tính toán chính xác chu kỳ khoảng cách hộp và ngày ôn tập kế tiếp.

---

## Slide 19 - Sequence: Exam Sitting Submission & Error Log Recording (UML 05)
Sơ đồ tuần tự widescreen trên màn hình miêu tả trọn vẹn vòng đời khi học sinh nhấn nút nộp bài thi. Yêu cầu đi qua Template Method của `SubmitAttemptController` để xác thực, sau đó chuyển sang `PracticeService`. Service nạp dữ liệu từ các Repository, lấy ra chiến lược chấm điểm từ Factory và gọi `Attempt.submit()`. Sau khi điểm được tính toán và bất biến được khóa lại, Service lưu bài thi, cập nhật điểm cao nhất cho học sinh, tự động ghi các câu sai vào `ErrorLog` và trả về kết quả 200 OK cho client.

---

## Slide 20 - Sequence: Flashcard Review via Leitner Spaced Repetition (UML 06)
Slide tiếp theo thể hiện sơ đồ tuần tự của nghiệp vụ ôn tập từ vựng ngắt quãng. Khi học sinh đánh giá mức độ ghi nhớ của một từ, `ReviewVocabCardController` tiếp nhận yêu cầu và gọi tới `VocabService`. Service nạp thẻ từ `VocabCardRepository` và kích hoạt phương thức `card.review()`. Đối tượng `LeitnerScheduler` sẽ tính toán ngày ôn tập tiếp theo dựa trên hộp hiện tại và điểm đánh giá, cập nhật trạng thái thẻ trước khi lưu vào MongoDB.

---

## Slide 21 - Design Patterns Catalog in RonanSAT v2
Trên slide là bảng tổng hợp các mẫu thiết kế GoF và DDD được áp dụng thực tế trong dự án. Chúng em sử dụng Repository để tách rời database; Strategy và Factory cho thuật toán tính điểm và tạo câu hỏi; Template Method trên BaseController và MongoRepository; Singleton cho Container Composition Root; Dependency Injection qua constructor; và các khái niệm DDD như Value Object (`ScaledScore`, `Email`) cùng Aggregate Root (`Attempt`, `Test`). Các mẫu thiết kế này phối hợp đồng bộ để tạo nên một hệ thống vững chắc và dễ mở rộng.

> **Nếu thầy hỏi:** *Việc áp dụng nhiều Design Pattern như vậy có làm phức tạp hóa mã nguồn không?*  
> **Trả lời:** *Dạ thưa thầy, ban đầu việc tạo các interface và factory đòi hỏi viết thêm một số file cấu trúc, nhưng lợi ích mang lại vượt trội: toàn bộ mã nguồn nghiệp vụ không còn câu lệnh rẽ nhánh if/else phức tạp, các module hoàn toàn tách rời (loose coupling) và có thể viết unit test độc lập 100% mà không cần khởi động database thật.*

---

## Slide 22 - Product UI: Student Dashboard & Digital Exam Room (Screenshots)
Về mặt giao diện, hình bên trái là Trang chủ của học sinh với biểu đồ xu hướng điểm số, điểm thi gần nhất 1360 điểm, nút tiếp tục luyện tập và số thẻ từ vựng cần ôn tập hôm nay. Hình bên phải là Phòng thi trực tuyến hiển thị câu hỏi Toán học kèm công thức KaTeX, đồng hồ đếm ngược và thanh điều hướng câu hỏi, tích hợp máy tính đồ thị Desmos trực tiếp trên góc phải màn hình.

---

## Slide 23 - Product UI: Result Breakdown & Deduplicated Error Log (Screenshots)
Sau khi nộp bài, học sinh nhận ngay bảng điểm chi tiết như hình bên trái: tổng điểm 1360 cùng điểm thành phần Reading & Writing 680 và Math 680, đi kèm ma trận 4 module trực quan. Hình bên phải là Sổ tay lỗi sai (Error Log) tự động lưu lại các câu trả lời sai hoặc bỏ qua, cho phép lọc theo kỹ năng, gắn nhãn nguyên nhân sai và làm lại câu hỏi trực tiếp trên màn hình để tự động đổi trạng thái sang "Đã khắc phục".

---

## Slide 24 - Product UI: Performance Statistics & Spaced Repetition Vocab (Screenshots)
Slide này minh họa 2 tính năng học tập chuyên sâu: Bên trái là Trang phân tích thống kê với biểu đồ Recharts, bản đồ nhiệt hoạt động học tập trong 12 tuần và tỷ lệ chính xác theo từng kỹ năng SAT. Bên phải là màn hình học từ vựng Flashcard theo thuật toán Leitner với 4 nút đánh giá (Again, Hard, Good, Easy) và số lượng thẻ đến hạn ôn tập trong ngày.

---

## Slide 25 - Product UI: Administrative Oversight & Question Authoring (Screenshots)
Slide này thể hiện giao diện dành cho Quản trị viên: Bên trái là bảng điều khiển tổng quan với các chỉ số KPI về tổng số người dùng, số lượng đề thi, ngân hàng câu hỏi và lượt làm bài. Bên phải là bộ công cụ soạn thảo câu hỏi toàn năng, hỗ trợ nhập đoạn văn đọc hiểu, các phương án lựa chọn, danh sách đáp án chấp nhận được của câu hỏi SPR và lời giải thích chi tiết.

---

## Slide 26 - Automated Testing: 64 Unit Tests Verifying OOP Rules
Chất lượng kiến trúc hướng đối tượng được minh chứng qua bộ 64 bài unit test tự động phân bổ trên 6 bộ kiểm thử: 16 bài cho thuật toán tính điểm và Value Object `ScaledScore`; 15 bài cho cơ chế so khớp đa hình câu hỏi SPR; 9 bài cho các Application Service; 11 bài cho User, RBAC và Error Log; 8 bài cho thuật toán dãn cách Leitner; và 5 bài kiểm tra tính bất biến của bài thi. Nhờ kiến trúc Port và In-Memory Repository, toàn bộ 64 bài kiểm thử chạy hoàn toàn độc lập với database và hoàn thành trong thời gian chưa đầy 2 giây.

> **Nếu thầy hỏi:** *Bộ unit test kiểm tra những bất biến nghiệp vụ nào của OOP?*  
> **Trả lời:** *Dạ thưa thầy, các unit test xác minh cụ thể rằng: một khi bài thi đã chuyển trạng thái `submitted`, mọi nỗ lực gọi `recordAnswer()` đều phải ném ra ngoại lệ `InvariantViolationError`; câu hỏi SPR chấp nhận các biểu diễn tương đương như `1/2`, `0.5`, `.5`; và thuật toán Leitner tính toán ngày ôn tập chính xác theo từng hộp.*

---

## Slide 27 - Architecture Evolution: v1 MVP vs. v2 OOP Edition
Bảng so sánh trên slide tóm tắt sự tiến hóa kiến trúc vượt bậc giữa 2 phiên bản: Từ các đối tượng hướng thủ tục và Mongoose document trần trụi ở bản v1, phiên bản v2 đã chuyển hóa hoàn toàn sang các Class hướng đối tượng với Dependency Injection; logic tính điểm và câu hỏi chuyển từ rẽ nhánh thủ tục sang mẫu thiết kế Strategy và Đa hình; ranh giới lưu trữ được chuẩn hóa bằng Repository Pattern; và toàn bộ vòng đời đối tượng được quản lý tập trung bởi Composition Root.

---

## Slide 28 - Technical Limitations & Future Engineering Roadmap
Với tinh thần kỹ thuật trung thực, nhóm em nhận diện rõ các giới hạn kỹ thuật hiện tại của phiên bản demo: Công thức quy đổi điểm số hiện là phép ánh xạ tuyến tính chuẩn hóa chứ chưa cài đặt mô hình Lý thuyết Ứng đáp Câu hỏi 3 tham số (IRT) của College Board; cơ sở dữ liệu dùng mongodb-memory-server để phục vụ chấm điểm tại chỗ; và phiên đăng nhập dùng JWT. Định hướng tương lai của nhóm là nâng cấp cơ chế thi thích ứng đa tầng (MST), bổ sung Domain Events để xử lý bất đồng bộ, và áp dụng mẫu Transactional Outbox.

---

## Slide 29 - Conclusion & Acknowledgments (Q&A)
Tóm lại, dự án RonanSAT v2 đã minh chứng việc áp dụng thành công các nguyên lý Lập trình hướng đối tượng, kiến trúc phân lớp sạch và các Design Pattern chuẩn mực vào một bài toán thực tế phức tạp. Hệ thống vừa đảm bảo tính kỷ luật trong thiết kế phần mềm, vừa sở hữu sản phẩm chạy thực tế với độ hoàn thiện cao và 64 bài kiểm thử tự động. Em xin chân thành cảm ơn thầy và các bạn đã lắng nghe. Nhóm em rất sẵn sàng đón nhận các câu hỏi phản biện từ thầy!

---

## Kịch Bản Thao Tác Demo Trực Tiếp (Live Demo Click Path)

Khi thực hiện demo trực tiếp cho thầy xem, người thuyết trình thực hiện tuần tự theo luồng chuẩn sau:

1. **Đăng nhập Học sinh (Student Login):**
   - Mở trình duyệt tại đường dẫn `http://localhost:3000/login`.
   - Đăng nhập với tài khoản học sinh thử nghiệm: `student@example.com` / `student123`.
2. **Trang chủ Học sinh (Student Home):**
   - Giới thiệu màn hình Dashboard: Thẻ điểm gần nhất (1360), biểu đồ xu hướng điểm số (Score Progression sparkline), số lỗi sai cần xem lại (Error Log count), và số từ vựng đến hạn ôn tập hôm nay.
3. **Vào phòng thi phân đoạn Toán (Practice Sectional Math):**
   - Nhấn nút "Continue Practice" hoặc vào menu **Practice** $\rightarrow$ Chọn chế độ **Sectional Practice** $\rightarrow$ Chọn môn **Math** của đề thi số 1.
4. **Làm bài thi trắc nghiệm MCQ & điền số SPR:**
   - Tại câu hỏi số 1 (MCQ): Chọn một phương án trả lời. Giới thiệu thanh công cụ máy tính đồ thị Desmos tích hợp trên góc phải và mở giao diện tính toán.
   - Chuyển sang câu hỏi điền số (SPR): Nhập đáp án phân số hoặc số thập phân (ví dụ `1/2` hoặc `0.5`). Nhấn "Next" để chứng minh tính năng lưu tạm thời qua `RecordAnswerController`.
5. **Nộp bài thi (Submit Exam):**
   - Nhấn nút "Submit Test" trên thanh điều hướng $\rightarrow$ Xác nhận nộp bài. Hệ thống kích hoạt chuỗi xử lý: `SubmitAttemptController` $\rightarrow$ `PracticeService` $\rightarrow$ `FullLengthScoringStrategy` / `SectionalScoringStrategy` $\rightarrow$ Lưu `Attempt`.
6. **Xem trang kết quả chi tiết (Result Detail):**
   - Màn hình tự động điều hướng sang `/results/[id]`: Trình bày điểm quy đổi SAT (Scaled Score), tỷ lệ chính xác theo module, và ma trận danh sách câu đúng/sai trực quan.
7. **Khắc phục lỗi sai trong Sổ tay lỗi (Error Log Retry):**
   - Nhấp vào "Open Error Log" từ trang kết quả hoặc chọn menu **Error Log**.
   - Xem câu hỏi vừa làm sai đã được tự động thêm vào danh sách mà không bị trùng lặp.
   - Nhấn "Retry", nhập đáp án chính xác để câu hỏi tự động chuyển sang trạng thái "Resolved".
8. **Học từ vựng ngắt quãng (Vocab Spaced Repetition):**
   - Chuyển sang mục **Vocab** $\rightarrow$ Chọn một bộ từ vựng (ví dụ "Advanced SAT Words") $\rightarrow$ Nhấn "Study Due Cards".
   - Lật thẻ từ vựng xem định nghĩa và ví dụ, sau đó nhấn nút đánh giá "Good". Trình bày việc hệ thống gọi `VocabCard.review()` chuyển thẻ sang Hộp Leitner tiếp theo.
9. **Đăng nhập Quản trị viên (Admin Login):**
   - Đăng xuất tài khoản học sinh $\rightarrow$ Đăng nhập bằng tài khoản quản trị: `admin@example.com` / `admin123`.
10. **Chỉnh sửa câu hỏi trong Admin Portal (Admin Question Authoring):**
    - Vào menu **Admin** $\rightarrow$ Tab **Questions Editor**.
    - Mở một câu hỏi bất kỳ, chỉnh sửa nội dung hoặc thêm đáp án được chấp nhận cho câu hỏi SPR, sau đó nhấn "Save" để chứng minh cơ chế phân quyền RBAC và thao tác CRUD an toàn.
