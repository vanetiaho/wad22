<script setup>
</script>

<template>
    <div class="tasksHeading">
        <h1 class="tasksTitle">CHOOSE A TASK TO<br>EARN REWARDS</h1>
    </div>
    <div class="cardContainer">
        <div class="card">
            <RouterLink to="/crowd">
            <h1>Crowd Level Update</h1>
            </RouterLink>
        </div>

        <div class="card">
            <RouterLink to="/studyPlanner">
            <h1>Study Plan Update</h1>
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.cardContainer {
    display: flex;
    flex-wrap: wrap;       /* allows cards to move to next line if needed */
    justify-content: center;
    gap: 20px;             /* space between cards */
    padding: 20px;         /* padding around container */
    margin: 50px auto;     /* center container horizontally */
    max-width: 1200px; 
}

.card {
    flex: 1 1 300px; 
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    transition: 0.3s;
    border-radius: 5px;
    background-color: #fdf9ee;
    color: #6d412a;
    padding: 60px 20px; 
    text-align: center;
    min-width: 250px;  
}

.card:hover {
    box-shadow: 0 15px 25px 0 rgba(0,0,0,0.2);
}

.card a {
    text-decoration: none;
    color: inherit;
}

</style>
