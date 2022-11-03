import axios from 'axios';
import { useContext } from 'react';
import { IoAdd } from 'react-icons/io5';
import {
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleLine,
} from 'react-icons/ri';
import { CiUndo, CiCircleRemove } from 'react-icons/ci';
import {
  StyledGlassButton,
  StyledPlusIcon,
  StyledGoBackIcon,
} from './buttons.styles';
// import { UserContext } from '../context';
import { UserContext } from '../../context';

function AttendButton({ partyId, isAttending, setIsAttending }: any) {
  const { user, setUser } = useContext(UserContext);

  const handleClick = async () => {
    try {
      if (!isAttending) {
        await axios.post('/api/party/attend', {
          party_id: partyId,
          user_id: user.id,
        });
        await setIsAttending(true);
      } else {
        await axios.delete('/api/party/role', {
          data: {
            party_id: partyId,
            user_id: user.id,
          },
        });
        await setIsAttending(false);
      }
    } catch (err) {
      console.error('Error message:', err);
    }
    axios
      .get('/api/user')
      .then((data) => {
        setUser(data.data);
      })
      .catch((err) => {
        console.error('The error from trying to update the user data:', err);
      });
  };

  return isAttending ? (
    <StyledGoBackIcon>
      <RiCheckboxCircleLine onClick={handleClick} />
    </StyledGoBackIcon>
  ) : (
    <StyledPlusIcon>
      <RiCheckboxBlankCircleLine onClick={handleClick} />
    </StyledPlusIcon>
  );
}

export default AttendButton;
