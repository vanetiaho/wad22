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
    padding: 10px;
    display: flex;
    justify-content: center;
    margin: 50px 400px 50px 400px;
}

.card {
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    transition: 0.3s;
    border-radius: 5px;
    background-color: #fdf9ee;
    color: #6d412a;
    padding: 90px 5px 90px 5px;
    margin: 10px;
    width: 100%;
    text-align: center;
    text-decoration: none;
}

.card:hover {
    box-shadow: 0 15px 25px 0 rgba(0,0,0,0.2);
}

.card a {
    text-decoration: none;
    color: inherit;
}

</style>
