import addInfraConfigs from './0001_add_infra_configs.mjs';
import addCiWorkflow from './0002_add_ci_workflow.mjs';
import addAgentsFragments from './0003_add_agents_fragments.mjs';

export const migrations = [addInfraConfigs, addCiWorkflow, addAgentsFragments];

