import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Result from "@/lib/models/Result"; // Bảng chứa kết quả làm bài

export const dynamic = "force-dynamic"; 

export async function GET() {
    try {
        await dbConnect();

        // 1. Tính mốc thời gian: 7 ngày trước so với hiện tại
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 2. Dùng Aggregation (Bộ gộp dữ liệu siêu mạnh của MongoDB) để tính toán
        const leaderboard = await Result.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    score: { $gt: 1450 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo" }, 
            {
                $group: {
                    _id: "$userId",
                    name: { $first: "$userInfo.name" },
                    testsCompleted: { $sum: 1 },
                    highestScore: { $max: "$score" }
                }
            },
            {
                $sort: { testsCompleted: -1, highestScore: -1 }
            },
            {
                $limit: 10
            }
        ]);

        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}