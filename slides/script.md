# RonanSAT — Kịch Bản Thuyết Trình OOP Lab (12 - 15 Phút)

- **Người trình bày (Presenter):** Le Vinh - 202417221 | Group 08 (Lê Vinh - MSSV: 202417221 - Nhóm 08)
- **Môn học:** Thực hành Lập trình hướng đối tượng (IT3100E Object-Oriented Programming Lab)
- **Đơn vị:** Viện Công nghệ Thông tin và Truyền thông (School of ICT) — Đại học Bách khoa Hà Nội (HUST)

---

## Slide 1 - Title: RonanSAT: Real OOP Architecture & IT3100E Syllabus Coverage
Em xin kính chào thầy và các bạn. Hôm nay em xin đại diện Nhóm 08 trình bày kiến trúc hướng đối tượng thực thụ của nền tảng RonanSAT — Nền tảng luyện thi chuẩn hóa Digital SAT. Dự án được thiết kế theo chuẩn Clean Architecture, áp dụng triệt để 4 trụ cột OOP, các Gang of Four Design Pattern và hiện thực hóa đầy đủ 100% nội dung chương trình học IT3100E từ Chương 3 đến Chương 13. Bài thuyết trình gồm 4 phần chính: kiến trúc phân lớp và mô hình miền DDD; 4 trụ cột OOP kèm mã nguồn thực tế; chuyên đề bao phủ toàn diện đề cương môn học (Observer, Generic, Đa giao diện, Ngoại lệ xâu chuỗi cause); và bộ 79 unit test tự động cùng kịch bản demo trực tiếp.

---

## Slide 2 - Product Overview: RonanSAT Features
RonanSAT là hệ thống luyện thi Digital SAT toàn diện với 2 phân hệ người dùng chính là Học sinh và Quản trị viên. Phía học sinh có thể làm bài thi bấm giờ gồm 4 module hoàn chỉnh hoặc luyện tập phân đoạn (Sectional) với tích hợp máy tính đồ thị Desmos và công thức toán học KaTeX chuẩn College Board. Hệ thống hỗ trợ song song 2 cơ chế câu hỏi: trắc nghiệm MCQ và câu hỏi điền số/phân số SPR với bộ so khớp dung sai tự động. Đặc biệt, kết quả thi được chấm điểm theo thang SAT thực tế, tự động tổng hợp vào Error Log chống trùng lặp và hỗ trợ học từ vựng SAT theo thuật toán lặp lại ngắt quãng Leitner 5 hộp. Dự án đã nạp sẵn 2 đề thi thật với 171 câu hỏi và chạy hoàn toàn offline qua MongoDB in-memory.

---

## Slide 3 - Technology Stack & Architectural Standards
Về mặt công nghệ, hệ thống sử dụng Next.js 16 và React 19 cho tầng giao diện người dùng, kết hợp bảng màu Warm Studio và Tailwind CSS v4. Các API Route Handler của Next.js được tinh gọn tối đa theo mô hình Thin Route Pattern: mỗi handler chỉ chứa 1 đến 5 dòng ủy quyền toàn bộ cho các lớp Controller OOP. Tầng ứng dụng và tầng miền là các class TypeScript thuần túy được bật chế độ `strict: true` tuyệt đối, không sử dụng kiểu dữ liệu `any`. Kiến trúc tuân thủ nghiêm ngặt nguyên lý Đảo ngược phụ thuộc (DIP), đảm bảo tầng miền hoàn toàn độc lập với thư viện cơ sở dữ liệu Mongoose bên ngoài.

---

## Slide 4 - Layered Architecture: Separation of Concerns
Mã nguồn của RonanSAT được phân chia thành 4 tầng rõ rệt: Tầng HTTP nhận diện request và ủy quyền cho BaseController; Tầng Application chứa các ca sử dụng dưới dạng Service được tiêm phụ thuộc qua constructor; Tầng Domain lưu trữ các thực thể nghiệp vụ thuần túy, Value Object, Scoring Strategy và DomainEventBus; và Tầng Infrastructure quản lý lưu trữ dữ liệu MongoDB cùng các driver mã hóa. Toàn bộ đồ thị phụ thuộc được khởi tạo tập trung tại Composition Root duy nhất là lớp `Container` Singleton nằm ở `lib/container.ts`.

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
Slide này thể hiện kiến trúc lưu trữ dữ liệu với việc áp dụng mẫu thiết kế Repository và Dependency Inversion. Tầng ứng dụng chỉ giao tiếp thông qua hợp đồng giao diện tổng quát có ràng buộc kiểu `IRepository<TEntity, TId>` và các interface chuyên biệt như `Clock` hay `PasswordHasher`. Lớp trừu tượng `MongoRepository` định nghĩa khung chuyển đổi Document-Entity theo Template Method, trong khi lớp `InMemoryRepository` dùng Map generic giúp chạy unit test độc lập không cần MongoDB. Lớp `Container` Singleton đóng vai trò nhà máy lắp ráp toàn bộ hệ thống ngay khi ứng dụng khởi động.

> **Nếu thầy hỏi:** *Việc dùng Generic In-memory Repository ở đây mang lại lợi ích gì so với mock trực tiếp bằng Jest/Vitest?*  
> **Trả lời:** *Dạ thưa thầy, lớp `InMemoryRepository<TEntity, TId>` dùng chung cấu trúc Map cho mọi entity, loại bỏ hoàn toàn mã trùng lặp giữa các repository mock, kiểm thử hành vi CRUD chân thực và giúp toàn bộ 79 unit test chạy xong chỉ trong chưa đầy 1 giây.*

---

## Slide 8 - System Use Case Model: Student Practice, Error Log & Vocab Lifecycle (UML 04a)
Đây là sơ đồ ca sử dụng chi tiết dành cho tác nhân Học sinh, được thiết kế theo luồng phẳng chuẩn mực với 0 đường giao cắt chéo. Học sinh là trung tâm của 4 nhóm ca sử dụng lớn: Làm bài thi thử (gồm Full-Length 4 module hoặc Sectional với tích hợp máy tính Desmos và công thức KaTeX); Tra cứu kết quả thi và xem ma trận điểm chi tiết; Quản lý sổ tay lỗi sai Error Log với cơ chế khử trùng lặp và làm lại câu sai trực tiếp; và cuối cùng là Ôn tập từ vựng Flashcard theo thuật toán dãn cách Leitner 5 hộp.

---

## Slide 9 - System Use Case Model: Platform Administration & Content Workflows (UML 04b)
Sơ đồ ca sử dụng tiếp theo dành riêng cho tác nhân Quản trị viên, cũng được thiết kế chuẩn xác với 0 đường giao cắt. Quản trị viên được xác thực qua cơ chế RBAC và làm chủ 2 nhóm nghiệp vụ chính: Quản lý nền tảng và bài thi (giám sát các chỉ số KPI, cấu hình thời gian thi, xuất bản bài thi); và Quản lý nội dung học thuật (soạn thảo câu hỏi trắc nghiệm MCQ, cấu hình quy tắc và dung sai câu hỏi điền số SPR, quản trị người dùng và biên tập các bộ từ vựng SAT).

---

## Slide 10 - OOP Pillar 1: Encapsulation & Invariant Protection
Trụ cột đầu tiên là Tính Đóng Gói (Encapsulation). Trong RonanSAT, các trường trạng thái nội bộ của Entity như `_status`, `_answers`, hay `_score` đều được khai báo `private` và chỉ truy cập qua getter đọc. Các bất biến nghiệp vụ (domain invariants) được bảo vệ tuyệt đối: ví dụ trong phương thức `recordAnswer()`, nếu bài thi đã ở trạng thái `submitted`, hệ thống sẽ ném ngay lỗi `InvariantViolationError`. Tương tự, các Value Object như `ScaledScore` và `Email` tự kiểm tra tính hợp lệ ngay trong hàm khởi tạo, ngăn chặn việc tạo ra các đối tượng ở trạng thái không hợp lệ.

> **Nếu thầy hỏi:** *Tại sao lại dùng Value Object cho ScaledScore và Email thay vì dùng kiểu number và string có sẵn?*  
> **Trả lời:** *Dạ thưa thầy, kiểu primitive number hay string không thể tự bảo vệ ràng buộc nghiệp vụ. Ví dụ `ScaledScore` bắt buộc tổng điểm phải từ 400 đến 1600 hoặc điểm sectional từ 200 đến 800. Đóng gói vào Value Object đảm bảo bất kỳ nơi nào trong hệ thống sở hữu đối tượng này đều chắc chắn mang giá trị hợp lệ mà không cần kiểm tra lại.*

---

## Slide 11 - OOP Pillar 2: Abstraction via Decoupled Contracts
Trụ cột thứ hai là Tính Trừu Tượng (Abstraction) thông qua các hợp đồng giao diện tách rời. Các nghiệp vụ cấp cao không bao giờ import trực tiếp các thư viện cấp thấp như Mongoose hay thời gian của hệ điều hành. Thay vào đó, chúng phụ thuộc vào các Port Interface như `ScoringStrategy`, `IRepository`, `Clock` và `DomainEventBus`. Trong đoạn code trích dẫn, `PracticeService` nhận các port này qua constructor, cho phép hoán đổi bộ tính điểm hoặc nguồn thời gian kiểm thử một cách minh bạch mà không cần sửa bất kỳ dòng mã nghiệp vụ nào.

> **Nếu thầy hỏi:** *Tại sao phải trừu tượng hóa Clock thành interface thay vì gọi thẳng `new Date()` trong service?*  
> **Trả lời:** *Dạ thưa thầy, các thuật toán học từ vựng lặp lại ngắt quãng (Leitner) phụ thuộc chặt chẽ vào thời gian. Nếu gọi `new Date()`, việc viết unit test kiểm tra thẻ có "đến hạn ôn tập sau 3 ngày" sẽ rất khó khăn và phải dùng hàm sleep. Với interface `Clock`, em có thể tiêm một mock clock có thời gian cố định hoặc nhảy cóc thời gian tùy ý trong unit test.*

---

## Slide 12 - OOP Pillar 3: Inheritance & Template Method Hierarchy
Trụ cột thứ ba là Tính Kế Thừa (Inheritance) được tổ chức theo hệ thống phân cấp chặt chẽ. Lớp trừu tượng `Entity<TId>` cung cấp logic so sánh định danh (`equals()`) được kế thừa bởi tất cả các thực thể trong miền như `User`, `Test`, `Question`, và `Attempt`. Cụ thể với câu hỏi, lớp trừu tượng `Question` định nghĩa các phương thức trừu tượng `isCorrect()` và `questionType`, sau đó được chuyên biệt hóa bởi `MultipleChoiceQuestion` và `StudentProducedResponseQuestion`. Ngoài ra, tính kế thừa còn được kết hợp với Template Method trên lớp `BaseController`.

---

## Slide 13 - OOP Pillar 4: Runtime Polymorphic Dispatch
Trụ cột thứ tư là Tính Đa Hình (Polymorphism) tại thời điểm thực thi. Thay vì dùng các câu lệnh rẽ nhánh `switch-case` hay `if-else` theo loại câu hỏi, phương thức `question.isCorrect(userAnswer)` được điều phối động tới lớp con tương ứng: so sánh chuỗi chính xác với câu hỏi trắc nghiệm MCQ, nhưng lại phân tích cú pháp phân số, số thập phân qua `parseNumeric()` và so khớp dung sai `Math.abs(userVal - acceptedVal) < 0.005` đối với câu hỏi SPR. Tương tự, phương thức `user.canAccessAdmin()` trả về `false` đối với `Student` và `true` đối với `Admin`, thể hiện chuẩn xác nguyên lý thay thế Liskov (LSP).

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
Sơ đồ thể hiện Test Aggregate và hệ thống câu hỏi đa hình vừa được cập nhật. Lớp cơ sở trừu tượng `Question` hiện thực hóa đồng thời 3 capability interface là `Gradable`, `Describable` và `Comparable<Question>`. Các lớp con `MultipleChoiceQuestion` và `StudentProducedResponseQuestion` kế thừa mã nguồn dùng chung từ `Question` đồng thời ghi đè logic chấm điểm riêng biệt. Quan hệ giữa `Test` và `Section` là Composition (`*--`), còn giữa `Test` và `Question` là Aggregation (`o--`) qua mã định danh câu hỏi.

---

## Slide 17 - Domain Model: Exam Sitting Aggregate & Deduplicated Error Log (UML 01b1)
Sơ đồ thực thể quá trình làm bài và sổ tay câu sai. `Attempt` là Aggregate Root quản lý trạng thái buổi thi, sở hữu các bản ghi câu trả lời bất biến `AnswerRecord` và điểm số chuẩn hóa `ScaledScore`. Khi bài thi có câu trả lời sai, hệ thống kích hoạt và ghi nhận lỗi vào `ErrorLogEntry` với cơ chế tự động khử trùng lặp theo cặp người dùng - câu hỏi.

---

## Slide 18 - Domain Model: Vocabulary Spaced Repetition Domain (UML 01b2)
Sơ đồ biểu diễn miền ôn tập từ vựng lặp lại ngắt quãng (Leitner 5-box). `VocabDeck` là Aggregate Root quản lý danh sách thẻ từ `VocabCard`. Nghiệp vụ ôn tập sử dụng mẫu Strategy qua interface `ReviewScheduler` và hiện thực `LeitnerScheduler` để tính toán chính xác chu kỳ khoảng cách hộp và ngày ôn tập kế tiếp.

---

## Slide 19 - Sequence: Exam Sitting Submission & Scoring Strategy (Part 1 - UML 05a)
Sơ đồ tuần tự phần 1 thể hiện giai đoạn tính điểm khi học sinh hoàn thành bài thi SAT. Khi học sinh bấm nộp bài, `SubmitAttemptController` tiếp nhận HTTP POST, gọi `BaseController` để kiểm tra phân quyền (RBAC) và xác thực dữ liệu đầu vào. Sau đó, controller gọi `PracticeService.submitAttempt()`. Service sử dụng `ScoringStrategyFactory` để lấy chiến lược tính điểm phù hợp (`FullLengthScoringStrategy`), rồi chuyển giao cho `Attempt.submit()`. Thực thể `Attempt` uỷ quyền tính điểm cho Strategy, nhận về điểm số chuẩn hoá (1360), và cập nhật trạng thái nội bộ thành `submitted`, bảo vệ chặt chẽ bất biến không cho sửa bài sau khi nộp.

---

## Slide 20 - Sequence: Observer Dispatch & Error Log Projection (Part 2 - UML 05b)
Sơ đồ tuần tự phần 2 tập trung vào giai đoạn phát sự kiện miền theo mẫu thiết kế Observer. Sau khi bài thi được lưu vào cơ sở dữ liệu, `PracticeService` xuất bản sự kiện `AttemptSubmitted` lên `DomainEventBus`. Bus này đồng bộ điều phối tới hai Subscriber độc lập: `StudentProgressHandler` (kiểm tra kiểu `instanceof Student` và cập nhật kỷ lục học tập) và `ErrorLogProjector` (tự động phân tích các câu sai, loại trừ trùng lặp và lưu vào sổ tay lỗi). Hai handler này hoàn thành trước khi Controller trả về phản hồi HTTP 200 OK cho học sinh, giúp `PracticeService` hoàn toàn tách biệt khỏi các tác vụ phụ.

> **Nếu thầy hỏi:** *Tại sao việc cập nhật điểm số và ghi lỗi sai lại chuyển sang dùng Observer Event Bus thay vì viết trực tiếp trong PracticeService?*  
> **Trả lời:** *Dạ thưa thầy, việc này tuân thủ nguyên lý Đơn nhiệm (Single Responsibility Principle). `PracticeService` chỉ nên chịu trách nhiệm về vòng đời bài thi và tính điểm. Việc cập nhật kỷ lục của học sinh hay ghi nhật ký lỗi sai là các tác vụ phụ (side effects); đưa vào các `EventHandler` riêng biệt giúp chúng ta có thể thêm các tác vụ mới như gửi email thông báo hay cấp huy hiệu mà không cần sửa đổi `PracticeService`.*

---

## Slide 21 - Sequence: Flashcard Review via Leitner Spaced Repetition (UML 06)
Slide tiếp theo thể hiện sơ đồ tuần tự của nghiệp vụ ôn tập từ vựng ngắt quãng. Khi học sinh đánh giá mức độ ghi nhớ của một từ, `ReviewVocabCardController` tiếp nhận yêu cầu và gọi tới `VocabService`. Service nạp thẻ từ `VocabCardRepository` và kích hoạt phương thức nạp chồng `card.review()`. Đối tượng `LeitnerScheduler` sẽ tính toán ngày ôn tập tiếp theo dựa trên hộp hiện tại và điểm đánh giá, cập nhật trạng thái thẻ trước khi lưu vào MongoDB.

---

## Slide 22 - Design Patterns Catalog in RonanSAT
Bảng trên màn hình tổng hợp toàn bộ các mẫu thiết kế GoF và DDD được áp dụng trong dự án, bao gồm mẫu **Observer** vừa được bổ sung tại `lib/domain/events/`. Các pattern phối hợp ăn ý: Controller dùng **Template Method**, tiêm phụ thuộc qua **DI**, tính điểm bằng **Strategy** & **Factory**, xuất bản sự kiện qua **Observer Bus**, và lưu trữ dữ liệu an toàn bằng **Repository Pattern**.

---

## Slide 23 - IT3100E Syllabus Coverage: Comprehensive OOP Matrix
Trên màn hình là Bảng đối sánh toàn diện giữa Đề cương môn học IT3100E (từ Chương 3 đến Chương 13) với mã nguồn thực tế của RonanSAT. Mỗi chương đều tương ứng với một file cụ thể, một ký hiệu (symbol) có thật và được kiểm chứng tự động qua lệnh `npm run check:oop` và 79 bài unit test. Từ đóng gói (Ch.3), nạp chồng constructor (Ch.4), nạp chồng phương thức & static (Ch.5), hợp thành & kết tập (Ch.6), đa giao diện (Ch.7), ép kiểu & đa hình (Ch.8), generics (Ch.9), ngoại lệ (Ch.10), observer (Ch.11) đến collections (Ch.12) và SOLID (Ch.13).

> **Nếu thầy hỏi:** *Làm thế nào để đảm bảo bảng đối sánh này không bị sai lệch với mã nguồn (anti-drift)?*  
> **Trả lời:** *Dạ thưa thầy, chúng em đã xây dựng công cụ kiểm tra tự động `scripts/check-oop-checklist.ts`. Khi chạy lệnh `npm run check:oop`, script sẽ quét mã nguồn AST và đối chiếu từng file, từng symbol xem có tồn tại thật và có test case tương ứng hay không. Cả 48 ký hiệu đều đã được kiểm chứng tự động 100%.*

---

## Slide 24 - Syllabus Ch.11: Observer Pattern & Domain Events
Slide này đi sâu vào Chương 11: Mẫu thiết kế Observer. Lớp `DomainEventBus<TEvents>` quản lý đăng ký và phát sự kiện trong bộ nhớ. Tham số kiểu `TEvents` ánh xạ tên sự kiện với kiểu dữ liệu payload, đảm bảo an toàn kiểu tuyệt đối ở thời điểm biên dịch. Khi `PracticeService` phát sự kiện `AttemptSubmittedEvent`, bus gọi phương thức `handle()` của `StudentProgressHandler` và `ErrorLogProjector`. Hai handler này tiêu thụ sự kiện qua interface `EventHandler<T>` và hoàn tất trước khi HTTP Controller trả về kết quả, đảm bảo tính nhất quán dữ liệu mà không làm lộ logic nội bộ.

> **Nếu thầy hỏi:** *Tại sao lại chọn Observer in-memory qua EventBus thay vì gọi trực tiếp hay dùng Message Queue như RabbitMQ?*  
> **Trả lời:** *Dạ thưa thầy, trong phạm vi một monolith process, `DomainEventBus` in-memory loại bỏ hoàn toàn sự phụ thuộc trực tiếp (coupling) giữa `PracticeService` với các tác vụ phụ trợ (`StudentProgressHandler`, `ErrorLogProjector`) mà không làm tăng độ phức tạp vận hành của message broker ngoài. Khi cần mở rộng phân tán, interface `EventHandler` vẫn giữ nguyên, chỉ cần thay đổi adapter bên dưới sang RabbitMQ.*

---

## Slide 25 - Syllabus Ch.7: Multiple Interface Realization & Segregation
Đây là minh chứng cho Chương 7: Đa giao diện và Nguyên lý phân tách giao diện (ISP). Thay vì tạo một interface lớn cồng kềnh, chúng em tách thành các giao diện năng lực nhỏ gọn: `Gradable` (chấm điểm), `Describable` (mô tả tóm tắt) và `Comparable<T>` (so sánh thứ tự). Lớp trừu tượng `Question` hiện thực hóa đồng thời cả 3 giao diện này. Nhờ đó, `TestService` có thể sắp xếp các câu hỏi theo thứ tự chuẩn mực bằng cách gọi `compareTo()` mà không cần biết câu hỏi đó là dạng trắc nghiệm hay tự luận.

> **Nếu thầy hỏi:** *Sự khác nhau cơ bản giữa abstract class `Question` và các interface năng lực ở đây là gì?*  
> **Trả lời:** *Dạ thưa thầy, `Question` là lớp trừu tượng vì nó chứa trạng thái dùng chung (như `_testId`, `_section`, `_points`) và phương thức mẫu. Còn các interface như `Gradable` hay `Comparable` chỉ định nghĩa hành vi mà một đối tượng có thể làm (capabilities) mà không chứa trạng thái, cho phép các thành phần khác chỉ phụ thuộc vào đúng vai trò mà chúng cần.*

---

## Slide 26 - Syllabus Ch.9: Generics, Bounded Types & Collection Containers
Chương 9 về Generics được thể hiện qua 3 cấu trúc then chốt: Thứ nhất, `IRepository<TEntity extends Entity<TId>, TId>` sử dụng kiểu tham số có chặn (bounded type parameter), bắt buộc thực thể phải kế thừa từ `Entity` để đảm bảo có trường định danh `id`. Thứ hai, lớp cơ sở `InMemoryRepository<TEntity, TId>` cài đặt sẵn các thao tác CRUD trên `Map<TId, TEntity>`, loại bỏ mã nguồn giả lập dư thừa. Thứ ba, lớp container `Page<T>` lưu trữ danh sách phân trang và cung cấp hàm chuyển đổi bậc cao `map<U>()` giúp biến đổi dữ liệu mà không làm mất thông tin phân trang.

> **Nếu thầy hỏi:** *Bounded type parameter `TEntity extends Entity<TId>` có tác dụng gì trong thực tế?*  
> **Trả lời:** *Dạ thưa thầy, ràng buộc chặn trên này ngăn không cho lập trình viên vô tình truyền các kiểu dữ liệu tuỳ tiện (như plain DTO hay string) vào Repository. Nó bảo đảm ở mức thời điểm biên dịch (compile-time) rằng bất kỳ đối tượng nào được lưu trữ đều là một thực thể miền có định danh `id` và phương thức kiểm tra bằng nhau `equals()`.*

---

## Slide 27 - Syllabus Ch.10: Domain Exceptions & Cause Chaining (Code)
Chương 10 được hiện thực qua hệ thống phân cấp ngoại lệ miền kế thừa từ `DomainError`. Điểm nổi bật là kỹ thuật Xâu chuỗi ngoại lệ (Exception Chaining) tương tự Java trên lớp `PersistenceError`: khi MongoDB gặp sự cố, phương thức tĩnh `wrap()` sẽ bọc lỗi tầng dưới vào thuộc tính `cause` chuẩn của JavaScript Error. Tại tầng HTTP, `HttpErrorMapper` sẽ bắt lỗi này và trả về mã lỗi 500 kèm thông báo chung, vừa giữ lại được stack trace nguyên bản ở phía server để gỡ lỗi, vừa ngăn chặn việc rò rỉ cấu trúc database ra phía người dùng.

> **Nếu thầy hỏi:** *Tại sao không để lỗi của MongoDB bắn thẳng ra ngoài cho lập trình viên dễ nhìn mà phải bọc lại?*  
> **Trả lời:** *Dạ thưa thầy, để lộ lỗi driver MongoDB ra ngoài phía HTTP client vi phạm nghiêm ngặt nguyên lý bảo mật (Information Disclosure) và phá vỡ ranh giới Clean Architecture. Việc bọc lỗi vào `PersistenceError` và giữ lại driver error trong `cause` giúp server có đầy đủ thông tin log nội bộ, trong khi client chỉ nhận được phản hồi HTTP 500 sạch sẽ.*

---

## Slide 28 - Exception Hierarchy: Domain Errors & HTTP Mapping (UML 08)
Sơ đồ UML thể hiện cấu trúc phân cấp ngoại lệ miền và cơ chế ánh xạ sang mã HTTP. Lớp trừu tượng `DomainError` là gốc của toàn bộ ngoại lệ nghiệp vụ (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `InvariantViolationError`, `PersistenceError`). Các lớp ngoại lệ này hoàn toàn không chứa trường `status` HTTP nhằm bảo vệ tính độc lập của tầng Domain. Thay vào đó, lớp `HttpErrorMapper` tại tầng HTTP Controller sử dụng chuỗi kiểm tra kiểu `instanceof` để ánh xạ từng ngoại lệ sang mã trạng thái chuẩn tương ứng: Validation 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409, InvariantViolation 422, và đặc biệt PersistenceError trở thành mã 500 ẩn danh (opaque) để tránh lộ thông tin nội bộ hệ thống.

> **Nếu thầy hỏi:** *Tại sao các lớp DomainError không có sẵn thuộc tính `status: number` để Controller đọc ra luôn cho tiện?*  
> **Trả lời:** *Dạ thưa thầy, tầng Domain là tầng trung tâm nghiệp vụ, hoàn toàn không được phụ thuộc vào giao thức truyền tải như HTTP hay gRPC. Nếu gán cứng mã HTTP status (như 400, 404) vào các lớp DomainError, chúng ta sẽ vi phạm nghiêm ngặt kiến trúc phân lớp sạch (Clean Architecture). Thay vào đó, `HttpErrorMapper` ở tầng Adapter/Controller chịu trách nhiệm chuyển dịch domain exception sang HTTP status code tương ứng.*

---

## Slide 29 - Syllabus Ch.5: Method Overloading & Static vs. Instance Members
Chương 5 về Nạp chồng phương thức và Thành viên tĩnh vs Thành viên thể hiện qua lớp `VocabCard`. Thuộc tính `MAX_BOX = 5` là hằng số `static` dùng chung cho toàn bộ lớp, không bị nhân bản ở từng đối tượng thẻ. Ngược lại, thuộc tính `_box` là thuộc tính thể hiện (instance) riêng biệt của mỗi thẻ. Phương thức `review()` được nạp chồng thành 2 chữ ký: dạng rút gọn `review(grade)` sử dụng bộ lập lịch mặc định cho giao diện người dùng, và dạng mở rộng `review(grade, scheduler, now)` cho phép tiêm đồng hồ và scheduler giả lập trong unit test.

> **Nếu thầy hỏi:** *Tại sao phương thức `review()` của `VocabCard` cần nạp chồng (overload) thay vì chỉ một hàm có tham số mặc định?*  
> **Trả lời:** *Dạ thưa thầy, nạp chồng cho phép tách biệt rõ ràng 2 mục đích sử dụng: Chữ ký 1 tham số `review(grade)` dành cho code production tiện lợi; trong khi chữ ký 3 tham số `review(grade, scheduler, now)` phục vụ Dependency Injection trong unit test, cho phép tiêm đồng hồ giả lập (`now`) để kiểm tra chính xác khoảng cách ngày ôn tập mà không bị phụ thuộc thời gian thực.*

---

## Slide 30 - Syllabus Ch.4: Constructor Overloading & Identity vs. Value Equality
Chương 4 thể hiện kỹ thuật Nạp chồng hàm khởi tạo và So sánh đối tượng. Lớp `ScaledScore` cung cấp 2 hàm khởi tạo: một dạng nhận đầy đủ props khi tái tạo từ database, và một dạng nhận điểm thành phần từ thuật toán tính điểm. Hàm khởi tạo tự động kiểm tra bất biến điểm SAT (400-1600). Về so sánh bằng: lớp `Entity` định nghĩa so sánh theo định danh (`this.id === other.id`) - hai bài thi cùng ID là cùng một bài thi; trong khi `ValueObject` so sánh theo cấu trúc giá trị - hai đối tượng `Email` có cùng địa chỉ thì được coi là bằng nhau.

> **Nếu thầy hỏi:** *Điểm khác nhau cốt lõi giữa so sánh thực thể (Entity) và so sánh đối tượng giá trị (Value Object) là gì?*  
> **Trả lời:** *Dạ thưa thầy, hai Thực thể bằng nhau khi và chỉ khi chúng có cùng định danh nghiệp vụ (`id`), dù các thuộc tính khác có thay đổi theo thời gian. Ngược lại, Đối tượng giá trị (Value Object) là bất biến (immutable), hai đối tượng bằng nhau khi toàn bộ thuộc tính cấu trúc của chúng giống hệt nhau (structural equality).*

---

## Slide 31 - Product UI: Student Dashboard & Digital Exam Room (Screenshots)
Về mặt giao diện thực tế của phiên bản mới: Hình bên trái là Trang Dashboard của học sinh được chụp trực tiếp từ phiên bản v3: biểu đồ xu hướng điểm số, điểm thi gần nhất 1360 điểm, nút tiếp tục luyện tập, số lỗi sai cần xem lại và danh sách từ vựng đến hạn ôn tập hôm nay. Hình bên phải là Phòng thi trực tuyến hiển thị câu hỏi Toán học kèm công thức KaTeX, đồng hồ đếm ngược và thanh điều hướng câu hỏi, tích hợp máy tính đồ thị Desmos trực tiếp trên góc phải màn hình.

---

## Slide 32 - Product UI: Result Breakdown & Deduplicated Error Log (Screenshots)
Sau khi nộp bài, học sinh nhận ngay bảng điểm chi tiết như hình bên trái: tổng điểm 1360 cùng điểm thành phần Reading & Writing 680 và Math 680, đi kèm ma trận 4 module trực quan. Hình bên phải là Sổ tay lỗi sai (Error Log) tự động lưu lại các câu trả lời sai hoặc bỏ qua, cho phép lọc theo kỹ năng, gắn nhãn nguyên nhân sai và làm lại câu hỏi trực tiếp trên màn hình để tự động đổi trạng thái sang "Đã khắc phục".

---

## Slide 33 - Product UI: Performance Statistics & Spaced Repetition Vocab (Screenshots)
Slide này minh họa 2 tính năng học tập chuyên sâu: Bên trái là Trang phân tích thống kê thực tế phiên bản v3 với biểu đồ Recharts, bản đồ nhiệt hoạt động học tập trong 12 tuần và tỷ lệ chính xác theo từng kỹ năng SAT. Bên phải là màn hình học từ vựng Flashcard theo thuật toán Leitner với 4 nút đánh giá (Again, Hard, Good, Easy) và số lượng thẻ đến hạn ôn tập trong ngày.

---

## Slide 34 - Product UI: Administrative Oversight & Question Authoring (Screenshots)
Slide này thể hiện giao diện dành cho Quản trị viên: Bên trái là bảng điều khiển tổng quan với các chỉ số KPI về tổng số người dùng, số lượng đề thi, ngân hàng câu hỏi và lượt làm bài. Bên phải là bộ công cụ soạn thảo câu hỏi toàn năng, hỗ trợ nhập đoạn văn đọc hiểu, các phương án lựa chọn, danh sách đáp án chấp nhận được của câu hỏi SPR và lời giải thích chi tiết.

---

## Slide 35 - Automated Testing: 79 Unit Tests Verifying OOP Rules
Chất lượng kiến trúc hướng đối tượng được minh chứng qua bộ 79 bài unit test tự động (tăng thêm 15 bài kiểm tra chuyên sâu cho các tính năng v3) phân bổ trên 8 bộ kiểm thử: 16 bài cho thuật toán tính điểm; 15 bài cho câu hỏi SPR; 11 bài cho các quy tắc nền tảng OOP Ch.3-7; 11 bài cho User và Error Log; 9 bài cho Services; 8 bài cho Leitner; 5 bài cho Attempt; và 4 bài cho Ngoại lệ xâu chuỗi và Observer Event Bus. Toàn bộ 79 bài kiểm thử chạy hoàn toàn độc lập với database và hoàn thành trong thời gian dưới 1 giây.

> **Nếu thầy hỏi:** *Tại sao bộ 79 unit test lại chạy rất nhanh (dưới 1 giây) mà vẫn kiểm thử được toàn diện kiến trúc?*  
> **Trả lời:** *Dạ thưa thầy, nhờ kiến trúc phân lớp sạch (Clean Architecture) và nguyên lý Đảo ngược phụ thuộc (DIP), tầng Domain và Application hoàn toàn độc lập với cơ sở dữ liệu thật. Chúng em sử dụng `InMemoryRepository` và test doubles nên 79 bài test chạy hoàn toàn trong RAM với Vitest, cho phản hồi tức thì mà vẫn xác minh chặt chẽ mọi quy tắc nghiệp vụ.*

---

## Slide 36 - Architecture Evolution: v1 MVP vs. v2 OOP vs. v3 Syllabus Edition
Bảng so sánh trên slide tóm tắt sự tiến hóa kiến trúc vượt bậc qua 3 giai đoạn: Bản v1 là MVP thủ tục; Bản v2 chuẩn hóa Clean Architecture và 4 trụ cột OOP; Bản v3 hoàn thiện toàn diện đề cương IT3100E: bổ sung Observer Event Bus, đa giao diện, generic repository và exception chaining. Hệ thống đạt độ chín muồi cao về cả mặt kỹ thuật học thuật lẫn tính sẵn sàng của sản phẩm.

> **Nếu thầy hỏi:** *Nâng cấp lớn nhất từ phiên bản v2 lên v3 là gì?*  
> **Trả lời:** *Dạ thưa thầy, phiên bản v2 đã có Clean Architecture nhưng một số logic còn xử lý inline (ví dụ cập nhật tiến độ khi nộp bài). Ở v3, nhóm đã hoàn thiện trọn vẹn toàn bộ đề cương IT3100E: chuyển sang hướng sự kiện với `DomainEventBus`, tách đa giao diện (`Gradable`, `Describable`, `Comparable`), áp dụng generic bounded repository và hệ thống ngoại lệ xâu chuỗi `cause` chuẩn mực.*

---

## Slide 37 - Technical Limitations & Future Engineering Roadmap
Với tinh thần kỹ thuật trung thực, nhóm em nhận diện rõ các giới hạn kỹ thuật và kế hoạch phát triển: Tính năng Domain Events trước đây nằm ở tương lai thì nay đã hoàn thành trọn vẹn tại phiên bản v3 với `DomainEventBus`. Định hướng tiếp theo của nhóm là mở rộng sang cơ chế hàng đợi phân tán (Kafka/RabbitMQ) khi mở rộng nhiều server, nghiên cứu cơ chế thi thích ứng đa tầng (MST), và áp dụng mẫu Transactional Outbox Pattern.

> **Nếu thầy hỏi:** *Khi áp dụng Domain Event Bus in-memory, nếu một handler bị lỗi thì có ảnh hưởng đến việc lưu Attempt không?*  
> **Trả lời:** *Dạ thưa thầy, hiện tại trong v3 các handler chạy tuần tự đồng bộ trong process. Nếu một handler ném lỗi, transaction có thể bị gián đoạn. Đây chính là lý do trong roadmap nhóm đã xác định bước cải tiến tiếp theo là áp dụng Transactional Outbox Pattern kết hợp với hàng đợi phân tán để tách biệt hoàn toàn độ tin cậy của các side effects.*

---

## Slide 38 - Conclusion & Acknowledgments (Q&A)
Tóm lại, dự án RonanSAT đã minh chứng việc áp dụng thành công các nguyên lý Lập trình hướng đối tượng, kiến trúc phân lớp sạch và trọn vẹn đề cương môn học IT3100E vào một bài toán thực tế phức tạp. Hệ thống vừa đảm bảo tính kỷ luật cao trong thiết kế phần mềm, vừa sở hữu sản phẩm chạy thực tế với độ hoàn thiện cao và 79 bài kiểm thử tự động. Em xin chân thành cảm ơn thầy và các bạn đã lắng nghe. Nhóm em rất sẵn sàng đón nhận các câu hỏi phản biện từ thầy!

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
5. **Nộp bài thi (Submit Exam) & Kích hoạt Observer:**
   - Nhấn nút "Submit Test" trên thanh điều hướng $\rightarrow$ Xác nhận nộp bài. Hệ thống kích hoạt chuỗi xử lý: `SubmitAttemptController` $\rightarrow$ `PracticeService` $\rightarrow$ `FullLengthScoringStrategy` / `SectionalScoringStrategy` $\rightarrow$ Lưu `Attempt` $\rightarrow$ Phát sự kiện `AttemptSubmitted` tới `DomainEventBus` $\rightarrow$ `StudentProgressHandler` & `ErrorLogProjector` cập nhật tự động.
6. **Xem trang kết quả chi tiết (Result Detail):**
   - Màn hình tự động điều hướng sang `/results/[id]`: Trình bày điểm quy đổi SAT (Scaled Score), tỷ lệ chính xác theo module, và ma trận danh sách câu đúng/sai trực quan.
7. **Khắc phục lỗi sai trong Sổ tay lỗi (Error Log Retry):**
   - Nhấp vào "Open Error Log" từ trang kết quả hoặc chọn menu **Error Log**.
   - Xem câu hỏi vừa làm sai đã được tự động thêm vào danh sách mà không bị trùng lặp nhờ Subscriber `ErrorLogProjector`.
   - Nhấn "Retry", nhập đáp án chính xác để câu hỏi tự động chuyển sang trạng thái "Resolved".
8. **Học từ vựng ngắt quãng (Vocab Spaced Repetition):**
   - Chuyển sang mục **Vocab** $\rightarrow$ Chọn một bộ từ vựng (ví dụ "Advanced SAT Words") $\rightarrow$ Nhấn "Study Due Cards".
   - Lật thẻ từ vựng xem định nghĩa và ví dụ, sau đó nhấn nút đánh giá "Good". Trình bày việc hệ thống gọi `VocabCard.review()` chuyển thẻ sang Hộp Leitner tiếp theo.
9. **Đăng nhập Quản trị viên (Admin Login):**
   - Đăng xuất tài khoản học sinh $\rightarrow$ Đăng nhập bằng tài khoản quản trị: `admin@example.com` / `admin123`.
10. **Chỉnh sửa câu hỏi trong Admin Portal (Admin Question Authoring):**
    - Vào menu **Admin** $\rightarrow$ Tab **Questions Editor**.
    - Mở một câu hỏi bất kỳ, chỉnh sửa nội dung hoặc thêm đáp án được chấp nhận cho câu hỏi SPR, sau đó nhấn "Save" để chứng minh cơ chế phân quyền RBAC và thao tác CRUD an toàn.
