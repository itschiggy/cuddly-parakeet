import React, { useState, useEffect } from 'react';
import { Loader2, User, AlertCircle, ChevronDown } from 'lucide-react';

const priorityLabels = {
  4: 'Urgent',
  3: 'High',
  2: 'Medium',
  1: 'Low',
  0: 'No priority'
};

const KanbanBoard = () => {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [grouping, setGrouping] = useState('status');
  const [sorting, setSorting] = useState('priority');
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.quicksell.co/v1/internal/frontend-assignment');
        const data = await response.json();
        setTickets(data.tickets);
        setUsers(data.users);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('kanbanState');
    if (savedState) {
      const { grouping, sorting } = JSON.parse(savedState);
      setGrouping(grouping);
      setSorting(sorting);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kanbanState', JSON.stringify({ grouping, sorting }));
  }, [grouping, sorting]);

  const handleGroupingChange = (option) => {
    setGrouping(option);
    setShowOptions(false);
  };

  const handleSortingChange = (option) => {
    setSorting(option);
    setShowOptions(false);
  };

  const groupTickets = () => {
    let grouped = {};
    
    if (grouping === 'status') {
      grouped = tickets.reduce((acc, ticket) => {
        (acc[ticket.status] = acc[ticket.status] || []).push(ticket);
        return acc;
      }, {});
    } else if (grouping === 'user') {
      grouped = tickets.reduce((acc, ticket) => {
        const user = users.find(u => u.id === ticket.userId);
        (acc[user.name] = acc[user.name] || []).push(ticket);
        return acc;
      }, {});
    } else if (grouping === 'priority') {
      grouped = tickets.reduce((acc, ticket) => {
        (acc[priorityLabels[ticket.priority]] = acc[priorityLabels[ticket.priority]] || []).push(ticket);
        return acc;
      }, {});
    }

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (sorting === 'priority') {
          return b.priority - a.priority;
        } else {
          return a.title.localeCompare(b.title);
        }
      });
    });

    return grouped;
  };

  const renderCard = (ticket) => (
    <div key={ticket.id} className="card">
      <div className="card-header">
        <span className="ticket-id">{ticket.id}</span>
        <User className="user-icon" />
      </div>
      <h3 className="card-title">{ticket.title}</h3>
      <div className="card-footer">
        <AlertCircle className="priority-icon" />
        <span className="priority-label">{priorityLabels[ticket.priority]}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <Loader2 className="loading-icon" />
      </div>
    );
  }

  const groupedTickets = groupTickets();

  return (
    <div className="kanban-board">
      <div className="controls">
        <button onClick={() => setShowOptions(!showOptions)} className="display-button">
          Display <ChevronDown className="chevron-icon" />
        </button>
        {showOptions && (
          <div className="options-dropdown">
            <div className="option-group">
              <h4>Grouping</h4>
              <select value={grouping} onChange={(e) => handleGroupingChange(e.target.value)} className="select-control">
                <option value="status">By Status</option>
                <option value="user">By User</option>
                <option value="priority">By Priority</option>
              </select>
            </div>
            <div className="option-group">
              <h4>Ordering</h4>
              <select value={sorting} onChange={(e) => handleSortingChange(e.target.value)} className="select-control">
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="board-columns">
        {Object.entries(groupedTickets).map(([group, tickets]) => (
          <div key={group} className="board-column">
            <h2 className="column-title">{group}</h2>
            {tickets.map(renderCard)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;