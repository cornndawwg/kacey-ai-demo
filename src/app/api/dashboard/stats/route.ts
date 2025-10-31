import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    // Get statistics for the user's company
    const [
      totalInterviews,
      completedInterviews,
      inProgressInterviews,
      totalArtifacts,
      totalChatSessions,
      totalRoles,
      recentInterviews,
      recentArtifacts,
      recentChatSessions
    ] = await Promise.all([
      // Total interview count
      prisma.interviewSession.count({
        where: {
          role: {
            companyId: user.companyId
          }
        }
      }),
      // Completed interviews
      prisma.interviewSession.count({
        where: {
          role: {
            companyId: user.companyId
          },
          status: 'COMPLETED'
        }
      }),
      // In progress interviews
      prisma.interviewSession.count({
        where: {
          role: {
            companyId: user.companyId
          },
          status: 'IN_PROGRESS'
        }
      }),
      // Total artifacts
      prisma.knowledgeArtifact.count({
        where: {
          role: {
            companyId: user.companyId
          }
        }
      }),
      // Total chat sessions
      prisma.chatSession.count({
        where: {
          role: {
            companyId: user.companyId
          }
        }
      }),
      // Total roles
      prisma.role.count({
        where: {
          companyId: user.companyId
        }
      }),
      // Recent interviews (last 5)
      prisma.interviewSession.findMany({
        where: {
          role: {
            companyId: user.companyId
          }
        },
        include: {
          role: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5
      }),
      // Recent artifacts (last 5)
      prisma.knowledgeArtifact.findMany({
        where: {
          role: {
            companyId: user.companyId
          }
        },
        include: {
          role: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),
      // Recent chat sessions (last 5)
      prisma.chatSession.findMany({
        where: {
          role: {
            companyId: user.companyId
          }
        },
        include: {
          role: true,
          chatMessages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5
      })
    ]);

    return NextResponse.json({
      stats: {
        totalInterviews,
        completedInterviews,
        inProgressInterviews,
        totalArtifacts,
        totalChatSessions,
        totalRoles
      },
      recent: {
        interviews: recentInterviews,
        artifacts: recentArtifacts,
        chatSessions: recentChatSessions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
});

