// File for handling user endpoints
import express, { Response, Router } from 'express';
import { RequestWithUser } from '../../interfaces/interfaces';
import { prisma } from '../db/index';

const user: Router = express.Router();

// Gets relevant user data from the database and appends it to the user
user.get('/', (req: RequestWithUser, res: Response) => {
  const { user } = req;
  if (user === undefined) {
    res.sendStatus(400);
  } else {
    // Getting all the user's playlists
    prisma.playlist
      .findMany({
        where: {
          user_id: user.id,
        },
        include: {
          playlist_videos: {
            select: {
              video: true,
            },
          },
        },
      })
      .then((playlists: any) => {
        user.playlists = playlists.map((pl) => ({
          id: pl.id,
          name: pl.name,
          description: pl.description,
          user_id: pl.user_id,
          thumbnail: pl.thumbnail,
          videos: pl.playlist_videos.map((plv) => plv.video),
        }));
        // Getting all the parties the user is affiliated with
        return prisma.party.findMany({
          where: {
            user_parties: {
              some: {
                user: {
                  id: user.id,
                },
              },
            },
          },
          include: {
            videos: true,
          },
        });
      })
      .then((parties: any) => {
        user.parties = parties;
        // Getting the user's roles in their parties
        return prisma.user_Party.findMany({
          where: {
            user_id: user.id,
          },
        });
      })
      .then((UP) => {
        user.parties = user.parties.map((p) => {
          p.role = UP.filter((up) => up.party_id === p.id)[0].role;
          return p;
        });
        // Getting the users followers
        return prisma.user.findMany({
          where: {
            relator: {
              some: {
                relatee_id: user.id,
              },
            },
          },
          select: {
            id: true,
            user_name: true,
          },
        });
      })
      .then((tempFollowers) => {
        // Storing the followers and following data in two places until
        // search component is improved
        user.tempFollowers = tempFollowers.map((f) => ({
          id: f.id,
          username: f.user_name,
        }));
        // TODO: Convert components that use the id string array to use the full object
        user.followers = user.tempFollowers.map((friend) => friend.id);
        // Getting the accounts the user follows
        return prisma.user.findMany({
          where: {
            relatee: {
              some: {
                relator_id: user.id,
              },
            },
          },
          select: {
            id: true,
            user_name: true,
          },
        });
      })
      .then((tempFollowing) => {
        user.tempFollowing = tempFollowing.map((f) => ({
          id: f.id,
          username: f.user_name,
        }));
        user.following = tempFollowing.map((follow) => follow.id);
        // Getting the accounts that block the user
        return prisma.relation.findMany({
          where: {
            relatee_id: user.id,
            type: 'BLOCK',
          },
          select: {
            relator_id: true,
          },
        });
      })
      .then((blockers) => {
        user.blockers = blockers.map((blocker) => blocker.relator_id);
        // Getting the accounts blocked by the user
        return prisma.relation.findMany({
          where: {
            relator_id: user.id,
            type: 'BLOCK',
          },
          select: {
            relatee_id: true,
          },
        });
      })
      .then((blocking) => {
        user.blocking = blocking.map((blocked) => blocked.relatee_id);
        res.status(200).json(user);
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(err.status);
      });
  }
});

// find the follows through the join table
user.get(
  '/explicit/followers/:id',
  async (req: RequestWithUser, res: Response) => {
    const { id } = req.params;
    try {
      const num = await prisma.relation.count({
        where: {
          relatee_id: id,
          type: 'FOLLOW',
        },
      });
      res.status(200).json(num);
    } catch (err) {
      console.error('The err from getting followers:\n', err);
      res.sendStatus(err.status);
    }
  }
);

// create a relation between current user and followed for a follow click
user.post('/follow', async (req: RequestWithUser, res: Response) => {
  // deconstruct req body
  const { followerId, followedId } = req.body;
  // create a new relation between the follower and the followed
  try {
    const existingFollow = await prisma.relation.findFirst({
      where: {
        AND: [
          { relator_id: followerId },
          { relatee_id: followedId },
          { type: 'FOLLOW' },
        ],
      },
    });
    if (existingFollow) {
      res.sendStatus(200);
    } else {
      await prisma.relation.create({
        data: {
          relator_id: followerId,
          relatee_id: followedId,
          type: 'FOLLOW',
        },
      });
      res.sendStatus(201);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// delete a relation between current user and followed
user.delete('/follow', (req: RequestWithUser, res: Response) => {
  // deconstruct req body
  const { followerId, followedId } = req.body;

  prisma.relation
    .deleteMany({
      where: {
        AND: [
          { relator_id: followerId },
          { relatee_id: followedId },
          { type: 'FOLLOW' },
        ],
      },
    })
    .then(() => {
      // console.log('heres the data after the update:\n', data);
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error('Err from follow delete:\n', err);
      res.sendStatus(500);
    });

  // delete the relation between the follower and the followed
});

// create a relation between current user and followed for a follow click
user.post('/block', async (req: RequestWithUser, res: Response) => {
  // deconstruct req body
  const { blockerId, blockedId } = req.body;
  // create a new relation between the follower and the followed
  try {
    const existingBlock = await prisma.relation.findFirst({
      where: {
        AND: [
          { relator_id: blockerId },
          { relatee_id: blockedId },
          { type: 'BLOCK' },
        ],
      },
    });
    if (existingBlock) {
      res.sendStatus(200);
    } else {
      await prisma.relation.create({
        data: {
          relator_id: blockerId,
          relatee_id: blockedId,
          type: 'BLOCK',
        },
      });
      await prisma.relation.deleteMany({
        where: {
          OR: [
            {
              AND: [
                { relatee_id: blockedId },
                { relator_id: blockerId },
                { type: 'FOLLOW' },
              ],
            },
            {
              AND: [
                { relatee_id: blockerId },
                { relator_id: blockedId },
                { type: 'FOLLOW' },
              ],
            },
          ],
        },
      });
      res.sendStatus(201);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// delete a BLOCK between current user and BLOCKed
user.delete('/block', (req: RequestWithUser, res: Response) => {
  // deconstruct req body
  const { blockerId, blockedId } = req.body;

  prisma.relation
    .deleteMany({
      where: {
        AND: [
          { relator_id: blockerId },
          { relatee_id: blockedId },
          { type: 'BLOCK' },
        ],
      },
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error('Err from follow delete:\n', err);
      res.sendStatus(500);
    });

  // delete the relation between the follower and the followed
});

export default user;
