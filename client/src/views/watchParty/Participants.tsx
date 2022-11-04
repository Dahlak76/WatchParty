import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Col } from 'react-bootstrap';
import { StyledListGroup, StyledParticipant, StyledListHeader } from './styles';

const { Check } = Form;

export function Participants({
  participants,
  setParticipants,
  room,
  status,
  vH,
}) {
  const [show, setShow] = useState(false);
  const [vHeight, setVHeight] = useState(
    vH.current ? (vH.current.clientHeight - 65) * 0.8 : '80%'
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
  }, [vHeight]);

  const changeRole = (i) => {
    const tempParticipants = participants.slice();
    tempParticipants[i].role =
      tempParticipants[i].role === 'ADMIN' ? 'NORMIE' : 'ADMIN';
    setParticipants(tempParticipants);
    axios
      .post('/api/party/role', {
        user_id: participants[i].id,
        party_id: room.id,
        role: tempParticipants[i].role,
      })
      .then(() => {
        // TODO: Somehow get all the places that can render this to update their
        // parties from the database to reflect the role changes
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleResize = () => {
    setVHeight(vH.current ? vH.current.clientHeight - 65 : '80%');
  };

  return (
    <Col md={4} style={{ display: 'flex', flexDirection: 'column' }}>
      <StyledListHeader
        onClick={() => setShow(!show)}
        hidden={!(status && status.role === 'CREATOR')}
      >
        Participants
      </StyledListHeader>
      <StyledListGroup
        id="dropdown-basic-button"
        title="Participants"
        style={{
          overflowY: 'auto',
          maxHeight: vHeight,
          textAlign: 'center',
        }}
        hidden={!(status && status.role === 'CREATOR')}
      >
        {participants.map((pt, i) =>
          pt.role !== 'CREATOR' ? (
            <StyledParticipant
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
              hidden={!show}
            >
              {pt.username}
              :
              {' '}
              <Check
                type="switch"
                label="Admin"
                onChange={() => changeRole(i)}
                checked={pt.role === 'ADMIN'}
              />
            </StyledParticipant>
          ) : null
        )}
      </StyledListGroup>
    </Col>
  );
}
