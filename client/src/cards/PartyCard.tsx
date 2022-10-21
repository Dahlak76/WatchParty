import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context';
import {
  StyledPartyCard,
  StyledCardFooter,
  StyledPartyTitle,
  StyledCardBody,
  StyledPartyDesc,
  StyledIsFollowing,
} from '../cards/cards.styles';

function PartyCard({ party }) {
  const { description, thumbnail, name, date_time, users } = party;
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const creator = users.filter((user) => user.role === 'CREATOR')[0];

  useEffect(() => {
    if (user.following.includes(creator.id)) {
      setIsFollowing(true);
    } else {
      setIsFollowing(false);
    }
  }, [user]);

  const handleCardClick = (party) => {
    // console.log('party in search:', party);
    navigate('/watchParty', {
      state: { party },
    });
  };

  const stringAbbreviator = (string, type) => {
    const dotDotDotConcat = (num) => {
      const strArr = string.slice(0, num).split(' ');
      return `${strArr.slice(0, strArr.length - 1).join(' ')}...`;
    };
    if (type === 'title') {
      if (string.length > 53) {
        return dotDotDotConcat(53);
      }
      return string;
    }
    if (type === 'description') {
      if (string.length > 93) {
        return dotDotDotConcat(93);
      }
      return string;
    }
  };

  const dateTimeConversion = (dateTime) => {
    const year = dateTime.slice(0, 4);
    const monthObj = {
      '01': 'Jan',
      '02': 'Feb',
      '03': 'Mar',
      '04': 'Apr',
      '05': 'May',
      '06': 'Jun',
      '07': 'Jul',
      '08': 'Aug',
      '09': 'Sep',
      10: 'Oct',
      11: 'Nov',
      12: 'Dec',
    };
    const month = monthObj[dateTime.slice(5, 7)];
    const day = dateTime[8] === '0' ? dateTime[9] : dateTime.slice(8, 10);
    const isAm = dateTime.slice(11, 13) < '13';
    const time = () => {
      if (isAm && dateTime[11] === 0) {
        return `${dateTime.slice(12, 16)}am`;
      }
      if (isAm) {
        return `${dateTime.slice(11, 16)}am`;
      }
      const pmHour = parseInt(dateTime.slice(11, 13), 10) - 12;
      return `${pmHour}${dateTime.slice(13, 16)} pm`;
      // isAm ? `${dateTime.slice(11, 13)  }am` : dateTime.slice()
    };
    return `Starts ${time()}, ${month} ${day}, ${year}`;
  };

  return (
    <StyledPartyCard onClick={() => handleCardClick(party)}>
      <Card.Img variant="top" src={thumbnail} />
      <StyledCardBody>
        <StyledPartyTitle>{stringAbbreviator(name, 'title')}</StyledPartyTitle>
        <StyledPartyDesc>
          {stringAbbreviator(description, 'description')}
        </StyledPartyDesc>
        <StyledIsFollowing>
          {`created by: ${creator.username}`}
          <Card.Text>{isFollowing ? 'following ✅' : '  '}</Card.Text>
        </StyledIsFollowing>
      </StyledCardBody>
      <StyledCardFooter>
        <small className="text-muted">{dateTimeConversion(date_time)}</small>
      </StyledCardFooter>
    </StyledPartyCard>
  );
}

export default PartyCard;
