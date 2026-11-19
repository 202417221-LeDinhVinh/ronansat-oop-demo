import dbConnect from "./mongodb";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher";
import { SystemClock } from "./infrastructure/security/SystemClock";
import { LeitnerScheduler } from "./domain/vocab/LeitnerScheduler";
import { DomainEventBus, DomainEvents } from "./domain/events";
import { StudentProgressHandler } from "./application/eventhandlers/StudentProgressHandler";
import { ErrorLogProjector } from "./application/eventhandlers/ErrorLogProjector";

import { MongoUserRepository } from "./infrastructure/persistence/MongoUserRepository";
import { MongoTestRepository } from "./infrastructure/persistence/MongoTestRepository";
import { MongoQuestionRepository } from "./infrastructure/persistence/MongoQuestionRepository";
import { MongoAttemptRepository } from "./infrastructure/persistence/MongoAttemptRepository";
import { MongoErrorLogRepository } from "./infrastructure/persistence/MongoErrorLogRepository";
import { MongoVocabDeckRepository } from "./infrastructure/persistence/MongoVocabDeckRepository";
import { MongoVocabCardRepository } from "./infrastructure/persistence/MongoVocabCardRepository";

import { AuthService } from "./application/services/AuthService";
import { TestService } from "./application/services/TestService";
import { PracticeService } from "./application/services/PracticeService";
import { ResultService } from "./application/services/ResultService";
import { ErrorLogService } from "./application/services/ErrorLogService";
import { StatisticsService } from "./application/services/StatisticsService";
import { VocabService } from "./application/services/VocabService";
import { AdminService } from "./application/services/AdminService";

import { RegisterController } from "./http/controllers/auth/RegisterController";
import {
    GetTestsController,
    GetTestByIdController,
    GetQuestionsController,
    GetQuestionExplanationController,
} from "./http/controllers/test";
import {
    StartAttemptController,
    RecordAnswerController,
    SubmitAttemptController,
} from "./http/controllers/practice";
import {
    GetResultsController,
    GetResultDetailController,
    CreateResultController,
} from "./http/controllers/results";
import {
    GetErrorLogController,
    UpdateErrorLogController,
    RetryErrorLogController,
} from "./http/controllers/errorlog";
import { GetStatisticsController } from "./http/controllers/statistics/GetStatisticsController";
import {
    GetVocabDecksController,
    CreateVocabDeckController,
    GetVocabDeckDetailController,
    UpdateVocabDeckController,
    DeleteVocabDeckController,
    CreateVocabCardController,
    UpdateVocabCardController,
    DeleteVocabCardController,
    GetDueCardsController,
    ReviewVocabCardController,
} from "./http/controllers/vocab/VocabControllers";
import {
    AdminMetricsController,
    AdminTestsController,
    AdminTestDetailController,
    AdminQuestionsController,
    AdminQuestionDetailController,
    AdminUsersController,
    AdminUserRoleController,
    AdminVocabDecksController,
    AdminVocabDecksListController,
    AdminVocabDeckDetailController,
} from "./http/controllers/admin/AdminControllers";
import {
    UserSettingsController,
    UserPasswordController,
    UserStatsController,
} from "./http/controllers/user/UserSettingsControllers";

/**
 * Dependency Injection Container and Composition Root.
 * Assembles all domain, application, infrastructure, and presentation components.
 * Patterns: Singleton Pattern, Composition Root, Dependency Injection.
 */
export class Container {
    private static instance: Container | null = null;

    // Infrastructure ports
    public readonly passwordHasher: BcryptPasswordHasher;
    public readonly clock: SystemClock;
    public readonly reviewScheduler: LeitnerScheduler;
    public readonly eventBus: DomainEventBus<DomainEvents>;

    // Repositories
    public readonly userRepository: MongoUserRepository;
    public readonly testRepository: MongoTestRepository;
    public readonly questionRepository: MongoQuestionRepository;
    public readonly attemptRepository: MongoAttemptRepository;
    public readonly errorLogRepository: MongoErrorLogRepository;
    public readonly vocabDeckRepository: MongoVocabDeckRepository;
    public readonly vocabCardRepository: MongoVocabCardRepository;

    // Application Services
    public readonly authService: AuthService;
    public readonly testService: TestService;
    public readonly practiceService: PracticeService;
    public readonly resultService: ResultService;
    public readonly errorLogService: ErrorLogService;
    public readonly statisticsService: StatisticsService;
    public readonly vocabService: VocabService;
    public readonly adminService: AdminService;

    // Controllers
    public readonly registerController: RegisterController;
    public readonly getTestsController: GetTestsController;
    public readonly getTestByIdController: GetTestByIdController;
    public readonly getQuestionsController: GetQuestionsController;
    public readonly getQuestionExplanationController: GetQuestionExplanationController;
    public readonly startAttemptController: StartAttemptController;
    public readonly recordAnswerController: RecordAnswerController;
    public readonly submitAttemptController: SubmitAttemptController;
    public readonly getResultsController: GetResultsController;
    public readonly getResultDetailController: GetResultDetailController;
    public readonly createResultController: CreateResultController;
    public readonly getErrorLogController: GetErrorLogController;
    public readonly updateErrorLogController: UpdateErrorLogController;
    public readonly retryErrorLogController: RetryErrorLogController;
    public readonly getStatisticsController: GetStatisticsController;
    public readonly getVocabDecksController: GetVocabDecksController;
    public readonly createVocabDeckController: CreateVocabDeckController;
    public readonly getVocabDeckDetailController: GetVocabDeckDetailController;
    public readonly updateVocabDeckController: UpdateVocabDeckController;
    public readonly deleteVocabDeckController: DeleteVocabDeckController;
    public readonly createVocabCardController: CreateVocabCardController;
    public readonly updateVocabCardController: UpdateVocabCardController;
    public readonly deleteVocabCardController: DeleteVocabCardController;
    public readonly getDueCardsController: GetDueCardsController;
    public readonly reviewVocabCardController: ReviewVocabCardController;
    public readonly adminMetricsController: AdminMetricsController;
    public readonly adminTestsController: AdminTestsController;
    public readonly adminTestDetailController: AdminTestDetailController;
    public readonly adminQuestionsController: AdminQuestionsController;
    public readonly adminQuestionDetailController: AdminQuestionDetailController;
    public readonly adminUsersController: AdminUsersController;
    public readonly adminUserRoleController: AdminUserRoleController;
    public readonly adminVocabDecksController: AdminVocabDecksController;
    public readonly adminVocabDecksListController: AdminVocabDecksListController;
    public readonly adminVocabDeckDetailController: AdminVocabDeckDetailController;
    public readonly userSettingsController: UserSettingsController;
    public readonly userPasswordController: UserPasswordController;
    public readonly userStatsController: UserStatsController;

    private constructor() {
        // Ensure DB connection is initiated if URI is configured
        if (process.env.MONGODB_URI) {
            dbConnect().catch((err) => console.error("[Container] MongoDB connection error:", err));
        }

        // 1. Ports
        this.passwordHasher = new BcryptPasswordHasher();
        this.clock = new SystemClock();
        this.reviewScheduler = new LeitnerScheduler();
        this.eventBus = new DomainEventBus<DomainEvents>();

        // 2. Repositories
        this.userRepository = new MongoUserRepository();
        this.testRepository = new MongoTestRepository();
        this.questionRepository = new MongoQuestionRepository();
        this.attemptRepository = new MongoAttemptRepository();
        this.errorLogRepository = new MongoErrorLogRepository();
        this.vocabDeckRepository = new MongoVocabDeckRepository();
        this.vocabCardRepository = new MongoVocabCardRepository();

        // Ch.11 Observer wiring: the composition root is the only place that knows both the
        // event bus and the concrete subscribers.
        this.eventBus.subscribe(
            "AttemptSubmitted",
            new StudentProgressHandler(this.userRepository)
        );
        this.eventBus.subscribe(
            "AttemptSubmitted",
            new ErrorLogProjector(this.errorLogRepository)
        );

        // 3. Application Services
        this.authService = new AuthService(this.userRepository, this.passwordHasher);
        this.testService = new TestService(this.testRepository, this.questionRepository);
        this.practiceService = new PracticeService(
            this.attemptRepository,
            this.testRepository,
            this.questionRepository,
            this.clock,
            this.eventBus
        );
        this.resultService = new ResultService(
            this.attemptRepository,
            this.testRepository,
            this.questionRepository
        );
        this.errorLogService = new ErrorLogService(
            this.errorLogRepository,
            this.questionRepository,
            this.testRepository,
            this.clock
        );
        this.statisticsService = new StatisticsService(
            this.attemptRepository,
            this.questionRepository,
            this.testRepository,
            this.userRepository
        );
        this.vocabService = new VocabService(
            this.vocabDeckRepository,
            this.vocabCardRepository,
            this.reviewScheduler,
            this.clock,
            this.eventBus
        );
        this.adminService = new AdminService(
            this.userRepository,
            this.testRepository,
            this.questionRepository,
            this.attemptRepository,
            this.vocabDeckRepository,
            this.vocabCardRepository
        );

        // 4. Controllers
        this.registerController = new RegisterController(this.authService);
        this.getTestsController = new GetTestsController(this.testService);
        this.getTestByIdController = new GetTestByIdController(this.testService);
        this.getQuestionsController = new GetQuestionsController(this.testService);
        this.getQuestionExplanationController = new GetQuestionExplanationController(
            this.questionRepository
        );
        this.startAttemptController = new StartAttemptController(this.practiceService);
        this.recordAnswerController = new RecordAnswerController(this.practiceService);
        this.submitAttemptController = new SubmitAttemptController(this.practiceService);
        this.getResultsController = new GetResultsController(this.resultService);
        this.getResultDetailController = new GetResultDetailController(this.resultService);
        this.createResultController = new CreateResultController(this.practiceService);
        this.getErrorLogController = new GetErrorLogController(this.errorLogService);
        this.updateErrorLogController = new UpdateErrorLogController(this.errorLogService);
        this.retryErrorLogController = new RetryErrorLogController(this.errorLogService);
        this.getStatisticsController = new GetStatisticsController(this.statisticsService);
        this.getVocabDecksController = new GetVocabDecksController(this.vocabService);
        this.createVocabDeckController = new CreateVocabDeckController(this.vocabService);
        this.getVocabDeckDetailController = new GetVocabDeckDetailController(this.vocabService);
        this.updateVocabDeckController = new UpdateVocabDeckController(this.vocabService);
        this.deleteVocabDeckController = new DeleteVocabDeckController(this.vocabService);
        this.createVocabCardController = new CreateVocabCardController(this.vocabService);
        this.updateVocabCardController = new UpdateVocabCardController(this.vocabService);
        this.deleteVocabCardController = new DeleteVocabCardController(this.vocabService);
        this.getDueCardsController = new GetDueCardsController(this.vocabService);
        this.reviewVocabCardController = new ReviewVocabCardController(this.vocabService);
        this.adminMetricsController = new AdminMetricsController(this.adminService);
        this.adminTestsController = new AdminTestsController(this.adminService);
        this.adminTestDetailController = new AdminTestDetailController(this.adminService);
        this.adminQuestionsController = new AdminQuestionsController(this.adminService);
        this.adminQuestionDetailController = new AdminQuestionDetailController(this.adminService);
        this.adminUsersController = new AdminUsersController(this.adminService);
        this.adminUserRoleController = new AdminUserRoleController(this.adminService);
        this.adminVocabDecksController = new AdminVocabDecksController(this.adminService);
        this.adminVocabDecksListController = new AdminVocabDecksListController(this.adminService);
        this.adminVocabDeckDetailController = new AdminVocabDeckDetailController(
            this.adminService
        );
        this.userSettingsController = new UserSettingsController(this.userRepository);
        this.userPasswordController = new UserPasswordController(
            this.userRepository,
            this.passwordHasher
        );
        this.userStatsController = new UserStatsController(
            this.userRepository,
            this.attemptRepository,
            this.errorLogRepository
        );
    }

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
}

export const container = Container.getInstance();
