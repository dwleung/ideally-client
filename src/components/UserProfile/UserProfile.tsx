import "./UserProfile.scss";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import orangeArrow from "../../assets/icons/orangeArrow.svg";
import Typewriter from "typewriter-effect";
import { getRandomText, loadingText, options } from "../../utils/typewriter";
import { UserComponentProps, Project } from "../../utils/interfaces";

interface UserInfo {
	id: number | undefined;
	name: string;
}

export default function UserProfile({
	baseUrl,
	setState,
	ideaList,
	setIdeaList,
	saveIdea,
	setProjectIdea,
	setSaveIdea,
}: UserComponentProps) {
	// STATE VARIABLES
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");
	const [interestsList, setInterestsList] = useState<string[]>([]);
	const [skillsList, setSkillsList] = useState<string[]>([]);
	const [userInfo, setUserInfo] = useState<UserInfo>({
		id: undefined,
		name: "",
	});
	//NAVIGATION
	const navigate = useNavigate();

	//Function to check if user is logged in: checks for token, navigates to login if no token
	const token: string | null = sessionStorage.getItem("JWT token");
	const checkToken = () => {
		if (!token) {
			navigate("/user/login");
		}
		return null;
	};

	// Send API Post call if user requested to save idea before login
	useEffect(() => {
		if (saveIdea === true && ideaList.length > 0) {
			const saveIdea = async () => {
				try {
					const response = await axios.post(
						`${baseUrl}user/ideas`,
						{
							title: ideaList[0].title,
							description: ideaList[0].description,
							requirements: ideaList[0].requirements,
						},
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);
					setSaveIdea(false);
					return console.log(
						"Save Idea response data",
						response
					);
				} catch (error) {
					setErrorMessage(
						`Unable to save idea to user profile: ${error}`
					);
				}
			};
			saveIdea();
		} else {
			const postPrompts = async () => {
				const interests = localStorage
					.getItem("Interests")
					?.split(",");
				const skills = localStorage.getItem("Skills")?.split(",");
				const toggles = localStorage.getItem("Toggles")?.split(",");

				try {
					await axios.post(
						`${baseUrl}user/prompts`,
						{
							interests: interests,
							skills: skills,
							toggles: toggles,
						},
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);
				} catch (error) {
					console.log(
						`Unable to save prompts to user profile: ${error}`
					);
				}
				postPrompts();
			};
		}
	}, []);

	// API CALLS FOR PROFILE INFORMATION
	useEffect(() => {
		setIsLoading(true);
		checkToken();

		// Fetch user name and id
		const fetchUserProfile = async () => {
			try {
				const response = await axios.get(`${baseUrl}user/profile`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				setIsLoading(false);
				setUserInfo({
					id: response.data.id,
					name: response.data.name,
				});
			} catch (error: any) {
				setErrorMessage(
					`There was an issue getting your profile: ${error.response.data.message}`
				);
			}
		};

		// Fetch saved prompts
		const fetchPrompts = async () => {
			try {
				const response = await axios.get(`${baseUrl}user/prompts`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				const prompts = response.data;
				prompts.forEach((element: any) => {
					const interests = element.interests.split(",");
					setInterestsList(interests);
					const skills = element.skills.split(",");
					const toggles = element.toggles.split(",");
					skills.push(toggles);
					setSkillsList(skills);
				});
			} catch (error: any) {
				setErrorMessage(
					`There was an issue getting your saved prompts: ${error.response.data.message}`
				);
			}
		};

		// Fetch saved ideas
		const fetchIdeas = async () => {
			try {
				const response = await axios.get(`${baseUrl}user/ideas`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				const ideas = response.data;

				// Parse "requirements" which is stored as string in database
				ideas.forEach((idea: any) => {
					{
						idea.requirements = JSON.parse(
							idea.requirements.split(",")
						);
					}
				});
				setIdeaList(ideas);
			} catch (error: any) {
				setErrorMessage(
					`There was an issue getting your saved ideas: ${error.response.data.message}`
				);
			}
		};

		fetchUserProfile();
		fetchPrompts();
		fetchIdeas();
		setIsLoading(false);
	}, [token]);

	// Navigate to idea details page with clicked idea
	const handleClickIdea = (idea: Project) => {
		setProjectIdea(idea);
		navigate("/idea/details");
	};

	// Logout function to remove local and session storage items
	const handleLogout = () => {
		setState(false);
		sessionStorage.removeItem("JWT token");
		localStorage.removeItem("Interests");
		localStorage.removeItem("Skills");
		localStorage.removeItem("Toggles");
		navigate("/");
	};

	return (
		<div className="profile">
			{errorMessage && (
				<div className="profile__error-message">{errorMessage}</div>
			)}
			<h2 className="profile__title">{userInfo.name}</h2>
			<section className="profile__section">
				<div className="profile__container">
					{interestsList && skillsList && (
						<>
							<div className="prompt">
								<div className="prompt__wrapper">
									<h4 className="prompt__subtitle">
										Interests:
									</h4>
									{interestsList?.map(
										(interest, i) => {
											return (
												<span
													key={i}
													className="prompt__item"
												>
													{interest}
												</span>
											);
										}
									)}
								</div>
								<div className="prompt__wrapper">
									<h4 className="prompt__subtitle">
										Skills:
									</h4>
									{skillsList?.map((skill, i) => {
										return (
											<span
												key={i}
												className="prompt__item"
											>
												{skill}
											</span>
										);
									})}
								</div>
							</div>
						</>
					)}
				</div>
				<div className="profile__container profile__container--ideas">
					<h3 className="profile__subheader">"My" Ideas</h3>
					{!ideaList.length ? (
						<p className="profile__note">
							You don't have any saved ideas yet!
						</p>
					) : (
						""
					)}

					{ideaList.map((idea) => {
						return (
							<div
								key={idea.id}
								className="profile__idea-wrapper"
							>
								<p className="profile__idea">
									{idea.title}
								</p>
								<img
									className="profile__idea-button"
									onClick={() =>
										handleClickIdea(idea)
									}
									src={orangeArrow}
									alt="orange arrow pointing right"
								/>
							</div>
						);
					})}
				</div>
			</section>
			<button
				className="button button--cancel profile__button"
				onClick={handleLogout}
			>
				LOG OUT
			</button>
			{isLoading === true && (
				<div
					id="loading-modal"
					className={`modal ${
						isLoading === true ? "modal--show" : ""
					}`}
				>
					<Typewriter
						options={options}
						onInit={(typewriter: any) => {
							loadingText.forEach(() => {
								typewriter
									.typeString(getRandomText())
									.pauseFor(500)
									.deleteAll();
							});
							typewriter.start();
						}}
					/>
				</div>
			)}
		</div>
	);
}
