import autogen
from autogen.agentchat.contrib.captainagent import AgentBuilder

config_file_or_env = "../../OAI_CONFIG_LIST"
llm_config = {"temperature": 0}
config_list = autogen.config_list_from_json(config_file_or_env, filter_dict={"model": ["gemini-2.5-flash"]})


def start_task(execution_task: str, agent_list: list, coding=True):
    group_chat = autogen.GroupChat(
        agents=agent_list,
        messages=[],
        max_round=12,
        allow_repeat_speaker=agent_list[:-1] if coding is True else agent_list,
    )
    manager = autogen.GroupChatManager(
        groupchat=group_chat,
        llm_config={"config_list": config_list, **llm_config},
    )
    agent_list[0].initiate_chat(manager, message=execution_task)


builder = AgentBuilder(
    config_file_or_env=config_file_or_env, builder_model=["gemini-2.5-flash"], agent_model=["gemini-2.0-flash"]
)

building_task = """
Generate a team of agents specializing in scientific literature review and critical analysis. 
This team should include:
1.  A 'Researcher' agent capable of programmatically searching academic databases (like PubMed, Web of Science, or general web search for journal articles, not just Arxiv) for recent papers on nutrition and medical science.
2.  An 'Analyst' agent skilled in interpreting scientific studies, identifying methodologies, results, limitations, and potential biases.
3.  A 'Synthesizer' agent that can summarize findings, compare different studies, and extract key advantages and disadvantages related to health interventions.
4.  A 'Medical Fact-Checker' or 'Critic' agent to assess health claims, particularly controversial ones like "detoxing," against established scientific consensus.
The agents should be able to collaborate to execute complex research queries.
"""

execution_task = """
Conduct an extensive research project on 'juice fasts'. 
Specifically, identify recent scientific papers (published within the last 5 years if possible) from reputable medical and nutrition journals.
For each relevant paper found:
1.  Summarize its main findings regarding juice fasts.
2.  Extract any documented potential advantages.
3.  Extract any documented potential disadvantages or risks.
4.  Critically evaluate the scientific evidence regarding whether juice fasts "actively help in detoxing." Address the scientific consensus (or lack thereof) on the concept of detoxification via juice fasts.
5.  Provide a balanced conclusion based on the scientific evidence, avoiding anecdotal claims.
"""

agent_list, agent_configs = builder.build(building_task, llm_config)

start_task(
    execution_task=execution_task,
    agent_list=agent_list,
    coding=agent_configs["coding"],
)

builder.clear_all_agents(recycle_endpoint=True)

saved_path = builder.save()
