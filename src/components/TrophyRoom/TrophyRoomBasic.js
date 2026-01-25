import React from 'react';
import './TrophyRoom.css';
import PageHeader from '../shared/PageHeader';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { BsTrophy, BsFlag, BsCalendarEvent, BsPeople, BsPersonFill } from 'react-icons/bs';
import { GiRaceCar, GiPodium } from 'react-icons/gi';
import { FaFlagCheckered, FaUsers } from "react-icons/fa";
import { Link } from 'react-router-dom';

const TrophyRoomBasic = () => {
    const champions = [
        {
            id: 2,
            name: "verydystrbd",
            season: "Spring 2025",
            championship: "P4 (MCR S2000)",
            stats: "6 wins, 7 podiums, 7 poles",
            description: "A runaway championship victory, clinching the title with a 75% win rate.",
            seasonId: 28
        },
        {
            id: 2,
            name: "verydystrbd",
            season: "Winter 2024",
            championship: "Formula Junior",
            stats: "1 wins, 3 podiums, 1 pole",
            description: "Secured the championship with a win in the final race thanks to heavy attrition and a Michael Masi-esque intervention",
            seasonId: 25
        },
        {
            id: 3,
            name: "vandy.nick",
            season: "Spring 2024",
            championship: "Ginetta Cup",
            stats: "4 wins, 5 podiums, 3 fastest laps",
            description: "Dominant season win, leading the championship from start to finish",
            seasonId: 23
        },
        {
            id: 4,
            name: "Kirtis",
            season: "Winter 2023",
            championship: "Brazilian Multiclass - Prototype",
            stats: "4 wins, 5 podiums, 4 fastest laps",
            description: "A nail-biting championship win, with a decisive victory sealing the title in the final race",
            seasonId: 21
        },
        {
            id: 5,
            name: "GVONNY",
            season: "Spring 2023",
            championship: "GT4 Challenge",
            stats: "Season stats have been lost to history :(",
            description: "The very first Skidmark Tour champion, a true pioneer"
        }
    ];

    const specialEvents = [
        {
            id: 0,
            name: "iRacing Roar Before the 24",
            date: "January 10, 2026",
            position: "Victory",
            team: "Solo Entry",
            description: "1st in TCR class after starting from the back of the field - a historic first solo Special Event win for the Skidmark Tour",
            members: ["garrett.dix"]
        },
        {
            id: 1, 
            name: "iRacing Bathurst 12 Hour", 
            date: "February 22, 2025",
            position: "Podium Finish",
            team: "Skidmark Rejects",
            description: "3rd overall (GT3) - enduring 12 hours of treacherous conditions",
            members: ["Geeb", "garrett.dix", "Gilles", "Nalyd97", "verydystrbd"]
        },
        {
            id: 2,
            name: "iRacing Roar Before the 24",
            date: "January 11, 2025",
            position: "Podium Finish",
            team: "Solo Entry",
            description: "3rd in TCR class - the first solo Special Event podium for the Skidmark Tour",
            members: ["Gilles"]
        },
        {
            id: 3,
            name: "iRacing Petit Le Mans",
            date: "October 19, 2024",
            position: "Podium Finish",
            team: "Skidmark Rejects",
            description: "3rd in GT3 class - surviving intense multi-class racing for 10 hours",
            members: ["Gilles", "verydystrbd", "Nalyd97"]
        },
        {
            id: 4,
            name: "iRacing 2.4 Hours of Le Mans",
            date: "December 31, 2023",
            position: "Podium Finish", 
            team: "Skidmark Rejects",
            description: "3rd in GT3 class - sealed by a pass for the podium position on the penultimate lap",
            members: ["Gilles", "verydystrbd"]
        },
        {
            id: 5,
            name: "iRacing 6 Hours of Silverstone",
            date: "December 3, 2023",
            position: "Podium Finish",
            team: "Skidmark Rejects",
            description: "3rd in GT3 class - Skidmark Rejects' first podium!",
            members: ["Gilles", "verydystrbd"]
        }
    ];


    return (
        <div className="trophy-room">
            <PageHeader 
                title="Trophy Room" 
                subtitle="Our team iRacing achievements and AMS2 championship winners."
            />
            
            <Container className="my-5">
                
                <section className="mb-5">
                    <div className="section-header d-flex align-items-center mb-4">
                        <GiRaceCar className="section-icon text-warning me-3" />
                        <h2 className="mb-0">Skidmark Champions</h2>
                    </div>
                    
                    <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
                        {champions.map(champion => (
                            <Col key={champion.id}>
                                {champion.seasonId ? (
                                    // Wrap in Link only if seasonId exists
                                    <Link 
                                        to={`/league/${champion.seasonId}`} 
                                        className="text-decoration-none champion-link"
                                    >
                                        <Card className="trophy-card champion-card h-100">
                                            <Card.Body>
                                                <div className="champion-crown">
                                                    <BsTrophy />
                                                </div>
                                                <Card.Title className="trophy-title">{champion.name}</Card.Title>
                                                <div className="champion-season">
                                                    <BsFlag className="me-2" />
                                                    {champion.season}
                                                </div>
                                                <div className="champion-championship">{champion.championship}</div>
                                                <div className="champion-stats">{champion.stats}</div>
                                                <Card.Text className="mt-2">{champion.description}</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Link>
                                ) : (
                                    // Just the card without link if no seasonId
                                    <Card className="trophy-card champion-card h-100">
                                        <Card.Body>
                                            <div className="champion-crown">
                                                <BsTrophy />
                                            </div>
                                            <Card.Title className="trophy-title">{champion.name}</Card.Title>
                                            <div className="champion-season">
                                                <BsFlag className="me-2" />
                                                {champion.season}
                                            </div>
                                            <div className="champion-championship">{champion.championship}</div>
                                            <div className="champion-stats">{champion.stats}</div>
                                            <Card.Text className="mt-2">{champion.description}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Col>
                        ))}
                    </Row>
                </section>

                <section>
                    <div className="section-header d-flex align-items-center mb-4">
                        <FaFlagCheckered className="section-icon text-primary me-3" />
                        <h2 className="mb-0">Special Events</h2>
                    </div>
                    
                    {/* Added justify-content-center to center the cards within the row */}
                    <Row xs={1} md={2} lg={3} className="g-4 justify-content-center">
                        {specialEvents.map(event => (
                            <Col key={event.id}>
                                <Card className="trophy-card special-event h-100">
                                    <Card.Body>
                                        <div className="trophy-icon">
                                            <BsTrophy />
                                        </div>
                                        <Card.Title className="trophy-title">{event.name}</Card.Title>
                                        <div className="achievement-position">
                                            <GiPodium className="me-2" />
                                            {event.position}
                                        </div>
                                        <div className="trophy-details">
                                            <p><BsCalendarEvent className="me-2" />{event.date}</p>
                                            <p><BsPeople className="me-2" />{event.team}</p>
                                        </div>
                                        <Card.Text>{event.description}</Card.Text>
                                        
                                        {/* Members section - replaces highlight box */}
                                        <div className="members-box">
                                            <div className="members-header">
                                                <FaUsers className="me-2" />
                                                <span>Participants</span>
                                            </div>
                                            <div className="members-list">
                                                {event.members.map((member, index) => (
                                                    <Badge 
                                                        key={index} 
                                                        className="member-badge theme-badge"
                                                    >
                                                        <BsPersonFill className="member-icon" />
                                                        {member}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>
            </Container>
        </div>
    );
};

export default TrophyRoomBasic;